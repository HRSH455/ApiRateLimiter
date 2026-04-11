package com.work.RateLimiter.resolver;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import jakarta.servlet.http.HttpServletRequest;
import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

// Security model:
//   X-Forwarded-For is ONLY trusted if the direct TCP connection (remoteAddr)
//   comes from a known trusted proxy CIDR/IP configured via:
//     rate-limit.trusted-proxies=10.0.0.1,10.0.0.2 (expecting reverse proxy IPs here).
//
//   If no trusted proxies configured or remoteAddr not in the list -->
//   remoteAddr is used directly.
//
// X-Forwarded-For format: client, proxy1, proxy2  → we take the LAST entry
//   added by our trusted proxy (leftmost is client-supplied, untrustworthy).
//   When a trusted proxy appends the real client IP it goes at the end of
//   the chain added by it, so we use the first IP in the header that is NOT
//   a known trusted proxy — walking right to left.
@Component
public class ClientIdentityResolver {

    private static final Logger log = LoggerFactory.getLogger(ClientIdentityResolver.class);

    // Private/loopback ranges --> never appear as real client IPs
    private static final String[] PRIVATE_RANGES = {
        "10.", "172.16.", "172.17.", "172.18.", "172.19.", "172.20.", "172.21.",
        "172.22.", "172.23.", "172.24.", "172.25.", "172.26.", "172.27.", "172.28.",
        "172.29.", "172.30.", "172.31.", "192.168.", "127.", "0:0:0:0:0:0:0:1", "::1"
    };

    private final Set<String> trustedProxies;

    public ClientIdentityResolver(
            @Value("${rate-limit.trusted-proxies:}") String trustedProxiesConfig) {
        this.trustedProxies = Arrays.stream(trustedProxiesConfig.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toSet());

        if (trustedProxies.isEmpty()) {
            log.warn("No trusted proxies configured (rate-limit.trusted-proxies). " +
                     "X-Forwarded-For will be ignored. Set this to your reverse proxy IP(s).");
        } else {
            log.info("Trusted proxies: {}", trustedProxies);
        }
    }

    public String resolve(HttpServletRequest request) {
        String remoteAddr = request.getRemoteAddr();

        // Only trust X-Forwarded-For if the direct connection is from a known proxy
        if (!trustedProxies.isEmpty() && isTrustedProxy(remoteAddr)) {
            String xForwardedFor = request.getHeader("X-Forwarded-For");
            if (xForwardedFor != null && !xForwardedFor.isBlank()) {
                String clientIp = extractClientIp(xForwardedFor);
                if (clientIp != null) {
                    return clientIp;
                }
            }
        }

        return remoteAddr;
    }

    // Walk the XFF chain right-to-left, skip trusted proxies, return first untrusted IP.
    // "client, proxy1, proxy2" — rightmost entries are added last (closest to us).
    private String extractClientIp(String xForwardedFor) {
        String[] ips = xForwardedFor.split(",");
        for (int i = ips.length - 1; i >= 0; i--) {
            String ip = ips[i].trim();
            if (!isTrustedProxy(ip) && isValidPublicIp(ip)) {
                return ip;
            }
        }
        // All hops were trusted proxies
        log.warn("XFF chain contained only trusted-proxy IPs: {}. Falling back to remoteAddr.", xForwardedFor);
        return null;
    }

    private boolean isTrustedProxy(String ip) {
        return trustedProxies.contains(ip);
    }

    // Reject spoofed private/loopback IPs in the XFF header.
    // if in a VPN/internal setup — adjust PRIVATE_RANGES accordingly.
    private boolean isValidPublicIp(String ip) {
        if (ip == null || ip.isBlank()) return false;
        for (String range : PRIVATE_RANGES) {
            if (ip.startsWith(range)) return false;
        }
        try {
            InetAddress.getByName(ip); 
            return true;
        } catch (UnknownHostException e) {
            return false;
        }
    }
}
import { Component, OnInit, ChangeDetectionStrategy, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RateLimitService } from '../../services/rate-limit.service';
import { RateLimitRule, RateLimitRuleMap } from '../../models/rate-limit.model';

@Component({
  selector: 'app-config-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './config-editor.component.html',
  styleUrls: ['./config-editor.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfigEditorComponent implements OnInit {
  configMap: RateLimitRuleMap = {};
  selectedPath = '';
  config: RateLimitRule = {
    limit: 100,
    windowSecs: 60,
    strategy: 'fixed',
    keyPrefix: ''
  };
  errorMessage = '';
  private readonly destroyRef = inject(DestroyRef);

  constructor(private rateLimitService: RateLimitService) { }

  ngOnInit(): void {
    this.loadConfig();
  }

  loadConfig(): void {
    this.rateLimitService.getConfigMap().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data: RateLimitRuleMap) => {
        this.configMap = data;
        const paths = Object.keys(data);
        if (paths.length > 0) {
          this.selectedPath = paths[0];
          this.applySelectedConfig();
        }
      },
      error: (err) => {
        this.errorMessage = 'Unable to load config: ' + (err?.message || 'unknown error');
      }
    });
  }

  applySelectedConfig(): void {
    if (!this.selectedPath) {
      return;
    }
    const rule = this.configMap[this.selectedPath];
    if (!rule) {
      return;
    }
    this.config = {
      ...rule,
      windowSecs: rule.windowSecs ?? rule.windowSeconds ?? 60,
      keyPrefix: rule.keyPrefix || this.selectedPath
    };
  }

  updateConfig(): void {
    const updated = {
      ...this.configMap,
      [this.selectedPath]: {
        limit: this.config.limit,
        windowSecs: this.config.windowSecs ?? this.config.windowSeconds ?? 60,
        strategy: this.config.strategy,
        keyPrefix: this.config.keyPrefix || this.selectedPath
      }
    };

    this.rateLimitService.updateConfigMap(updated).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        alert('Config updated');
        this.loadConfig();
      },
      error: (err) => {
        this.errorMessage = 'Unable to update config: ' + (err?.message || 'unknown error');
      }
    });
  }

}
import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { take } from 'rxjs';
import { RateLimitService } from '../../services/rate-limit.service';
import { RateLimitRule, RateLimitRuleMap } from '../../models/rate-limit.model';
import { ToggleComponent, EmptyStateComponent } from '../../shared';

interface RuleDisplay {
  path: string;
  rule: RateLimitRule;
  enabled: boolean;
}

@Component({
  selector: 'app-config-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ToggleComponent, EmptyStateComponent],
  templateUrl: './config-editor.component.html',
  styleUrls: ['./config-editor.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfigEditorComponent implements OnInit {
  configMap: RateLimitRuleMap = {};
  rules: RuleDisplay[] = [];
  showModal = false;
  editingPath = '';
  errorMessage = '';
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  ruleForm: FormGroup;

  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly rateLimitService = inject(RateLimitService);
  private readonly cdr = inject(ChangeDetectorRef);

  constructor() {
    this.ruleForm = this.fb.group({
      path: ['', Validators.required],
      limit: [100, [Validators.required, Validators.min(1)]],
      windowSecs: [60, [Validators.required, Validators.min(1)]],
      strategy: ['fixed', Validators.required],
      rolloutPercent: [100, [Validators.min(0), Validators.max(100)]]
    });
  }

  ngOnInit(): void {
    this.loadConfig();
  }

  loadConfig(): void {
    this.rateLimitService.getConfigMap().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data: RateLimitRuleMap) => {
        this.configMap = data;
        this.updateRulesDisplay();
        this.errorMessage = '';
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.errorMessage = 'Unable to load config: ' + (err?.message || 'unknown error');
        this.cdr.markForCheck();
      }
    });
  }

  private updateRulesDisplay(): void {
    this.rules = Object.entries(this.configMap).map(([path, rule]) => ({
      path,
      rule,
      enabled: true
    }));
  }

  openNewRuleModal(): void {
    this.editingPath = '';
    this.ruleForm.reset({
      path: '',
      limit: 100,
      windowSecs: 60,
      strategy: 'fixed',
      rolloutPercent: 100
    });
    this.showModal = true;
    this.cdr.markForCheck();
  }

  editRule(path: string): void {
    const rule = this.configMap[path];
    if (rule) {
      this.editingPath = path;
      this.ruleForm.patchValue({
        path,
        limit: rule.limit,
        windowSecs: rule.windowSecs,
        strategy: rule.strategy,
        rolloutPercent: 100
      });
      this.showModal = true;
      this.cdr.markForCheck();
    }
  }

  closeModal(): void {
    this.showModal = false;
    this.editingPath = '';
    this.cdr.markForCheck();
  }

  saveRule(): void {
    if (this.ruleForm.valid) {
      const formValue = this.ruleForm.value;
      const newRule: RateLimitRule = {
        limit: formValue.limit,
        windowSecs: formValue.windowSecs,
        strategy: formValue.strategy,
        keyPrefix: formValue.path
      };

      const updatedConfig = { ...this.configMap };

      if (this.editingPath && this.editingPath !== formValue.path) {
        delete updatedConfig[this.editingPath];
      }

      updatedConfig[formValue.path] = newRule;

      this.rateLimitService.updateConfigMap(updatedConfig).pipe(
        take(1)  // one-shot, safe to use inside methods
      ).subscribe({
        next: () => {
          this.showToast('Rule saved successfully', 'success');
          this.closeModal();
          this.loadConfig();
        },
        error: (err) => {
          this.showToast('Failed to save rule: ' + (err?.message || 'unknown error'), 'error');
        }
      });
    }
  }

  deleteRule(path: string): void {
    if (confirm(`Delete rule for ${path}?`)) {
      const updatedConfig = { ...this.configMap };
      delete updatedConfig[path];

      this.rateLimitService.updateConfigMap(updatedConfig).pipe(
        take(1)
      ).subscribe({
        next: () => {
          this.showToast('Rule deleted successfully', 'success');
          this.loadConfig();
        },
        error: (err) => {
          this.showToast('Failed to delete rule: ' + (err?.message || 'unknown error'), 'error');
        }
      });
    }
  }

  toggleRule(path: string, enabled: boolean): void {
    this.showToast(`Rule ${enabled ? 'enabled' : 'disabled'}`, 'success');
  }

  private showToast(message: string, type: 'success' | 'error'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.cdr.markForCheck();
    setTimeout(() => {
      this.toastMessage = '';
      this.cdr.markForCheck();  // needed so toast visually disappears
    }, 2500);
  }

  getStrategyBadgeClass(strategy: string): string {
    switch (strategy) {
      case 'fixed': return 'strategy-fixed';
      case 'sliding': return 'strategy-sliding';
      case 'token': return 'strategy-token';
      default: return '';
    }
  }

  trackByPath(index: number, rule: RuleDisplay): string {
    return rule.path;
  }

  getEnvBadge(path: string): string {
    if (path.includes('prod')) return 'prod';
    if (path.includes('staging')) return 'staging';
    return 'dev';
  }
}
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RateLimitService } from '../../services/rate-limit.service';
import { RateLimitRule } from '../../models/rate-limit.model';

@Component({
  selector: 'app-config-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './config-editor.component.html',
  styleUrls: ['./config-editor.component.css']
})
export class ConfigEditorComponent implements OnInit {
  config: RateLimitRule = {
    id: 'default',
    endpoint: '/api/test',
    method: 'GET',
    limit: 100,
    windowSeconds: 60,
    strategy: 'FixedWindow'
  };

  constructor(private rateLimitService: RateLimitService) { }

  ngOnInit(): void {
    this.loadConfig();
  }

  loadConfig(): void {
    this.rateLimitService.getConfig().subscribe((data: RateLimitRule[]) => {
      if (data.length > 0) {
        this.config = data[0];
      }
    });
  }

  saveConfig(): void {
    this.rateLimitService.updateConfig([this.config]).subscribe();
  }

  updateConfig(): void {
    this.rateLimitService.updateConfig([this.config]).subscribe(() => {
      alert('Config updated');
    });
  }

}
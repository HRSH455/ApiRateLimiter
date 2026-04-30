import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],   
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  username = '';
  password = '';
  error = '';
  loading = false;

  constructor(private auth: AuthService, private router: Router , private route: ActivatedRoute) {}

  onLogin() {
    if (!this.username || !this.password) {
      this.error = 'Please enter username and password';
      return;
    }

    this.loading = true;
    this.error = '';

    this.auth.login(this.username, this.password).subscribe({
      next: () =>{
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || 'config';
        this.router.navigate([`/${returnUrl}`]);
      },
      error: (err) => {
        this.error = err.message;
        this.loading = false;
      }
    });
  }
}
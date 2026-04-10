import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectorRef, Component, Inject, OnInit, PLATFORM_ID
 } from '@angular/core';
import { Router } from '@angular/router'; // ✅ CORRECT
import { StorageService } from '../../../auth/services/storage/storage-service';





@Component({
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.css',
  standalone:false
})
export class AdminLayout implements OnInit {
    data: any;
    options: any;
     data2: any;
    options2: any;
 private roles: string[] = [];
  isLoggedIn = false;
  showAdminBoard = false;
  showuserBoard = false;
  showfinanceBoard = false;
  showRhBoard = false;
  username?: string;
  isSidebarOpen = true;
  constructor(
     private cd: ChangeDetectorRef, // <-- Injection ici
    @Inject(PLATFORM_ID) private platformId: Object,
     private storageService: StorageService,
    private router: Router) {}

ngOnInit(): void {
        this.initChart();
         this.isLoggedIn = this.storageService.isLoggedIn();
    if (this.isLoggedIn) {
      const user = this.storageService.getUser();
      this.roles = user.roles;
      this.showAdminBoard = this.roles.includes('ROLE_ADMIN');
      this.showuserBoard = this.roles.includes('ROLE_USER');
      this.showfinanceBoard = this.roles.includes('ROLE_CAISSIER');
      this.showRhBoard = this.roles.includes('ROLE_RESPONSABLE_PERSONNEL');
      this.username = user.username;
    }
  }

isAccountOpen = false;


  logout(): void {
    // Clear session/auth data and navigate to login
    sessionStorage.clear();
    localStorage.removeItem('authToken');
     localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }

  initChart() {
        if (isPlatformBrowser(this.platformId)) {
            const documentStyle = getComputedStyle(document.documentElement);
            const textColor = documentStyle.getPropertyValue('--p-text-color');
            const textColorSecondary = documentStyle.getPropertyValue('--p-text-muted-color');

            this.data = {
                labels: ['Eating', 'Drinking', 'Sleeping', 'Designing', 'Coding', 'Cycling', 'Running'],
                datasets: [
                    {
                        label: 'My First dataset',
                        borderColor: documentStyle.getPropertyValue('--p-gray-400'),
                        pointBackgroundColor: documentStyle.getPropertyValue('--p-gray-400'),
                        pointBorderColor: documentStyle.getPropertyValue('--p-gray-400'),
                        pointHoverBackgroundColor: textColor,
                        pointHoverBorderColor: documentStyle.getPropertyValue('--p-gray-400'),
                        data: [65, 59, 90, 81, 56, 55, 40]
                    },
                    {
                        label: 'My Second dataset',
                        borderColor: documentStyle.getPropertyValue('--p-cyan-400'),
                        pointBackgroundColor: documentStyle.getPropertyValue('--p-cyan-400'),
                        pointBorderColor: documentStyle.getPropertyValue('--p-cyan-400'),
                        pointHoverBackgroundColor: textColor,
                        pointHoverBorderColor: documentStyle.getPropertyValue('--p-cyan-400'),
                        data: [28, 48, 40, 19, 96, 27, 100]
                    }
                ]
            };

            this.options = {
                plugins: {
                    legend: {
                        labels: {
                            color: textColor
                        }
                    }
                },
                scales: {
                    r: {
                        grid: {
                            color: textColorSecondary
                        }
                    }
                }
            };
        }
        this.cd.markForCheck();
    }


     initChart2() {
        if (isPlatformBrowser(this.platformId)) {
            const documentStyle = getComputedStyle(document.documentElement);
            const textColor = documentStyle.getPropertyValue('--p-text-color');
            const textColorSecondary = documentStyle.getPropertyValue('--p-text-muted-color');
            const surfaceBorder = documentStyle.getPropertyValue('--p-content-border-color');

            this.data2 = {
                labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
                datasets: [
                    {
                        label: 'First Dataset',
                        data: [65, 59, 80, 81, 56, 55, 40],
                        fill: false,
                        tension: 0.4,
                        borderColor: documentStyle.getPropertyValue('--p-cyan-500')
                    },
                    {
                        label: 'Second Dataset',
                        data: [28, 48, 40, 19, 86, 27, 90],
                        fill: false,
                        borderDash: [5, 5],
                        tension: 0.4,
                        borderColor: documentStyle.getPropertyValue('--p-orange-500')
                    },
                    {
                        label: 'Third Dataset',
                        data: [12, 51, 62, 33, 21, 62, 45],
                        fill: true,
                        borderColor: documentStyle.getPropertyValue('--p-gray-500'),
                        tension: 0.4,
                        backgroundColor: 'rgba(107, 114, 128, 0.2)'
                    }
                ]
            };

            this.options2 = {
                maintainAspectRatio: false,
                aspectRatio: 0.6,
                plugins: {
                    legend: {
                        labels: {
                            color: textColor
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: textColorSecondary
                        },
                        grid: {
                            color: surfaceBorder
                        }
                    },
                    y: {
                        ticks: {
                            color: textColorSecondary
                        },
                        grid: {
                            color: surfaceBorder
                        }
                    }
                }
            };
            this.cd.markForCheck();
        }
    }
}

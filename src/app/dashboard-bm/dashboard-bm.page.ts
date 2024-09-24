import { Component, OnInit, OnDestroy } from '@angular/core';
import { MaintenanceRequestService } from '../services/maintenance-request.service';
import { RequestModalComponent } from '../request-modal/request-modal.component';
import { AlertController, ModalController } from '@ionic/angular';
import { AuthenticationService } from '../services/authentication.service';
import { Subscription, of, switchMap } from 'rxjs';

@Component({
  selector: 'app-dashboard-bm',
  templateUrl: './dashboard-bm.page.html',
  styleUrls: ['./dashboard-bm.page.scss'],
})
export class DashboardBmPage implements OnInit, OnDestroy {
  requests: any[] = [];
  filteredRequests: any[] = [];
  filter: string = 'all';
  bmEmail: string = '';
  maintenanceRequests: any[] = [];
  isRequestsLoaded: boolean = false; // Define this property
  userSubscription!: Subscription; // Define the userSubscription property

  constructor(
    private maintenanceRequestService: MaintenanceRequestService,
    private modalController: ModalController,
    private authService: AuthenticationService,
    private alertController: AlertController,
  ) {}

  ngOnInit() {
    // Call the correct method to fetch the requests
    this.subscribeToUserData();
  }

  // Clean up the subscription when the component is destroyed
  ngOnDestroy() {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  private subscribeToUserData() {
    console.log('Subscribing to user data');
    
    // Subscribe to user authentication changes
    this.userSubscription = this.authService.user$.pipe(
      switchMap((user: any) => {
        if (user && user.email) {
          console.log('Fetching maintenance requests for Business Manager:', user.email);
          
          // Fetch maintenance requests where bm_email matches the logged-in user's email
          return this.maintenanceRequestService.getRequestsByBusinessManagerEmail(user.email);
        } else {
          console.log('No authenticated user, returning null');
          return of(null);
        }
      })
    ).subscribe(
      (requests: any) => {
        console.log('Received maintenance requests:', requests);
        if (requests && requests.length > 0) {
          this.maintenanceRequests = requests; // Store the fetched requests
          this.isRequestsLoaded = true;
        } else {
          this.maintenanceRequests = [];
          this.isRequestsLoaded = false;
          console.warn('No matching maintenance requests found');
        }
        console.log('Requests loaded:', this.isRequestsLoaded);
      },
      (error: any) => {
        console.error('Error in user subscription:', error);
        this.maintenanceRequests = [];
        this.isRequestsLoaded = false;
      }
    );
  }

  segmentChanged(event: any) {
    this.filter = event.detail.value;
    this.applyFilter();
  }

  applyFilter() {
    if (this.filter === 'All') {
      this.filteredRequests = this.maintenanceRequests; // Assuming requests fetched successfully
    } else {
      this.filteredRequests = this.maintenanceRequests.filter(request => request.status === this.filter);
    }
  }
  

  async openModal(request: any) {
    const modal = await this.modalController.create({
      component: RequestModalComponent,
      componentProps: {
        request
      }
    });

    return await modal.present();
  }
}

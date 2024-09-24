import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AlertController, LoadingController } from '@ionic/angular';
import { UserProfileService } from '../services/user-profile.service';
import { AuthenticationService } from '../services/authentication.service';
import { MaintenanceRequestService } from '../services/maintenance-request.service';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { of, switchMap } from 'rxjs';
import emailjs from 'emailjs-com';

@Component({
  selector: 'app-report-issue-sp',
  templateUrl: './report-issue-sp.page.html',
  styleUrls: ['./report-issue-sp.page.scss'],
})
export class ReportIssueSpPage implements OnInit {

  userEmail: string = ''; // Email of the logged-in service provider
  userProfile: any = {}; // Store the user profile data
  maintenanceRequests: any[] = []; // List of maintenance requests
  userSubscription: any; // Add this property
  isRequestsLoaded: boolean = false; // Add this property
  bm_email: string = '';

  constructor(
    private firestore: AngularFirestore,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private userProfileService: UserProfileService,
    private maintenanceRequestService: MaintenanceRequestService,
    private afAuth: AngularFireAuth, // Inject AngularFireAuth
    private authService: AuthenticationService // Inject AuthService
  ) {}

  ngOnInit() {
    //this.fetchUserEmail();
    // this.fetchUserProfile();
    this.subscribeToUserData();
  }

  private subscribeToUserData() {
    console.log('Subscribing to user data');
    this.userSubscription = this.authService.user$.pipe(
      switchMap((user: any) => {
        if (user && user.email) {
          console.log('Fetching user profile for:', user.email);
          return this.userProfileService.getUserProfile(user.email).pipe(
            switchMap((userData: any) => {
              if (userData) {
                // Fetch maintenance requests where serviceProvider.email matches
                return this.maintenanceRequestService.getRequestsByServiceProviderEmail(user.email);
              } else {
                console.log('User profile not found, returning null');
                return of(null);
              }
            })
          );
        } else {
          console.log('No authenticated user, returning null');
          return of(null);
        }
      })
    ).subscribe(
      (requests: any) => {
        console.log('Received maintenance requests:', requests);
        if (requests) {
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
  
  

  // Fetch the logged-in user's email and profile
  async fetchUserEmail() {
    try {
      const user = await this.afAuth.currentUser;
      if (user && user.email) {
        this.userEmail = user.email;
        this.fetchUserProfile(); // Fetch user profile once we have the email
      } else {
        console.error('No user logged in or user email is null');
      }
    } catch (error) {
      console.error('Error fetching user email:', error);
    }
  }

  // Fetch user profile based on the email using UserProfileService
  fetchUserProfile() {
    this.userProfileService.getUserProfile(this.userEmail).subscribe({
      next: (profile: any) => {
        if (profile) {
          this.userProfile = profile;
          this.fetchMaintenanceRequests(); // Fetch maintenance requests after getting the user profile
        }
      },
      error: (error) => {
        console.error('Error fetching user profile:', error);
      }
    });
  }

  // Fetch maintenance requests where the logged-in user is a service provider
  async fetchMaintenanceRequests() {
    const loading = await this.loadingController.create({ message: 'Fetching maintenance requests...' });
    await loading.present();

    this.maintenanceRequestService.getRequestsByServiceProviderEmail(this.userEmail).subscribe({
      next: (requests: any[]) => {
        this.maintenanceRequests = requests;
        loading.dismiss();
      },
      error: (error) => {
        console.error('Error fetching maintenance requests', error);
        loading.dismiss();
      }
    });
  }

  // Update request status to 'completed'
  async completeRequest(request: any) {
    try {
      await this.maintenanceRequestService.updateRequest(request.id, { status: 'completed' });

      const alert = await this.alertController.create({
        header: 'Success',
        message: 'Request marked as completed.',
        buttons: ['OK']
      });

      console.log('bm email:',request.bm_email)

      const emailParams = {
        email_to: request.bm_email, // Use the specific request object
        from_email: 'Fixify',
        subject: 'Fixify Account Update',
        message: `This email is to report that the ${request.type} which had ${request.description} has been fixed.`
    };

      await emailjs.send('service_1q81bzl','template_6j0vslg', emailParams, '0MDnRX4laSOlAEn54');
      await alert.present();
    } catch (error) {
      console.error('Error completing request', error);
      const errorAlert = await this.alertController.create({
        header: 'Error',
        message: 'Failed to complete the request.',
        buttons: ['OK']
      });
      await errorAlert.present();
    }
  }
}

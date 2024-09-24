import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthenticationService } from '../services/authentication.service';
import { UserProfileService } from '../services/user-profile.service';
import { of, Subscription, switchMap } from 'rxjs';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-explore-container',
  templateUrl: './explore-container.component.html',
  styleUrls: ['./explore-container.component.scss'],
  standalone: true,
  imports: [IonicModule, ReactiveFormsModule, CommonModule],
})
export class ExploreContainerComponent implements OnInit, OnDestroy {
  @Input() request: any;
  form!: FormGroup;

  userData: any = null;
  isUserDataLoaded: boolean = false;
  private userSubscription: Subscription | undefined;

  constructor(
    private modalController: ModalController,
    private formBuilder: FormBuilder,
    private authService: AuthenticationService,
    private userProfileService: UserProfileService 
  ) {
    console.log('ExploreContainerComponent constructed');
  }

  ngOnInit() {
    console.log('ExploreContainerComponent initializing');
    this.initForm();
    this.subscribeToUserData();
  }

  ngOnDestroy() {
    console.log('ExploreContainerComponent destroying');
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  private initForm() {
    this.form = this.formBuilder.group({
      amount: ['', [Validators.required, Validators.min(0)]],
      startDate: [null, Validators.required],
      specialRequest: [''],
      otherServices: [''],
    });
    console.log('Form initialized');
  }

  private subscribeToUserData() {
    console.log('Subscribing to user data');
    this.userSubscription = this.authService.user$.pipe(
      switchMap((user: any) => {
        if (user && user.email) {
          console.log('Fetching user profile for:', user.email);
          return this.userProfileService.getUserProfile(user.email);
        } else {
          console.log('No authenticated user, returning null');
          return of(null);
        }
      })
    ).subscribe(
      (userData: any) => {
        console.log('Received user data:', userData);
        if (userData) {
          this.userData = userData;
          // Check for fields that exist in your data
          this.isUserDataLoaded = Boolean(userData.email && userData.surname);
        } else {
          this.userData = null;
          this.isUserDataLoaded = false;
          console.warn('User profile not found or error fetching user data');
        }
        console.log('User data loaded:', this.isUserDataLoaded);
        console.log('User data:', this.userData);
      },
      (error: any) => {
        console.error('Error in user subscription:', error);
        this.userData = null;
        this.isUserDataLoaded = false;
      }
    );
  }
  

  onSubmit() {
    console.log('onSubmit called');
    console.log('Form valid:', this.form.valid);
    console.log('User data loaded:', this.isUserDataLoaded);

    if (this.form.valid && this.isUserDataLoaded) {
      console.log('Form data:', this.form.value);
      console.log('User data:', this.userData);

      const formData = this.form.value;
      const serviceProvider = {
        email: this.userData.email,
        name: this.userData.name,
        surname: this.userData.surname,
        phoneNumber: this.userData.phoneNumber,
        location: this.userData.location,
        services: this.userData.services
      };

      const updatedRequest = {
        ...this.request,
        ...formData,
        progress: 'pendingOne',
        serviceProvider: serviceProvider
      };

      console.log('Updated request:', updatedRequest);

      this.modalController.dismiss(updatedRequest);
    } else {
      console.error('Form is invalid or user data is not fully loaded');
      if (!this.form.valid) {
        console.error('Form validation errors:', this.form.errors);
      }
      if (!this.isUserDataLoaded) {
        console.error('Missing user data');
      }
    }
  }

  cancel() {
    console.log('Cancel called');
    this.form.reset();  // Reset form on cancel
    this.userData = null;  // Reset user data
    this.modalController.dismiss();
  }
}

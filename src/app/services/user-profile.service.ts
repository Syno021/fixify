import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, of } from 'rxjs';
import { FileStorageService } from './file-storage.service';
import { catchError, switchMap } from 'rxjs/operators';
import { map } from 'rxjs/operators';
import { AngularFireFunctions } from '@angular/fire/compat/functions';
import { DocumentReference } from '@angular/fire/compat/firestore';

@Injectable({
  providedIn: 'root'
})
export class UserProfileService {
  constructor(
    private firestore: AngularFirestore,
    private fileStorage: FileStorageService,
    private functions: AngularFireFunctions
  ) {}

  // Update user profile with optional profile picture
  updateUserProfile(userId: string, data: any, profilePicture?: File): Observable<any> {
    if (profilePicture) {
      return this.fileStorage.uploadFile(profilePicture, `profile-pictures/${userId}`).pipe(
        switchMap(downloadURL => {
          data.profilePictureUrl = downloadURL;
          return this.firestore.doc(`users/${userId}`).update(data);
        })
      );
    } else {
      return new Observable(observer => {
        this.firestore.doc(`users/${userId}`).update(data)
          .then(() => observer.next())
          .catch(error => observer.error(error))
          .finally(() => observer.complete());
      });
    }
  }

  // Get user profile by email
  getUserProfile(email: string): Observable<any> {
    return this.firestore.collection('users', ref => ref.where('email', '==', email))
      .valueChanges({ idField: 'userId' })
      .pipe(
        map(users => {
          if (users.length > 0) {
            return users[0];
          } else {
            console.warn(`No user found with email: ${email}`);
            return null;
          }
        }),
        catchError(error => {
          console.error('Error fetching user profile:', error);
          return of(null);
        })
      );
  }

  // NEW: Get user profile by userId
  getUserProfileById(userId: string): Observable<any> {
    return this.firestore.doc(`users/${userId}`).valueChanges().pipe(
      map(user => user ? { ...user, userId } : null)
    );
  }

  // Method to suspend a user account
  suspendAccount(userId: string): Promise<void> {
    return this.firestore.doc(`users/${userId}`).update({ status: 'suspended' });
  }

  // Method to update the status of an issue
  updateIssueStatusById(issueId: string, status: string, resolutionMessage: string): Promise<void> {
    return this.firestore.doc(`issues/${issueId}`).update({ status: status, resolutionMessage: resolutionMessage });
  }

  // Method to report an issue
  reportIssue(buildingManagerEmail: string, serviceProviderEmail: string, issueDescription: string): Promise<DocumentReference<unknown>> {
    const issue = {
      buildingManagerEmail: buildingManagerEmail,
      serviceProviderEmail: serviceProviderEmail,
      description: issueDescription,
      status: 'resolved',
      createdAt: new Date()
    };
    return this.firestore.collection('issues').add(issue);
  }
}

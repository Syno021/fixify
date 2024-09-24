import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import firebase from 'firebase/compat/app';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MaintenanceRequestService {
  constructor(private firestore: AngularFirestore) {}

  saveImageUrl(requestId: string, imageUrl: string): Promise<any> {
    return this.firestore.collection('maintenanceRequests').doc(requestId).collection('images').add({ url: imageUrl });
  }

  createRequest(request: any): Promise<any> {
    return this.firestore.collection('maintenanceRequests').add(request);
  }

  getRequests(): Observable<any[]> {
    return this.firestore.collection('maintenanceRequests').valueChanges({ idField: 'id' });
  }

  getRequestById(requestId: string): Promise<any> {
    return this.firestore.collection('maintenanceRequests').doc(requestId).get().toPromise()
      .then(doc => {
        if (doc && doc.exists) {
          return doc.data();
        } else {
          throw new Error('Document not found');
        }
      });
  }

  // Method to fetch requests by business manager's email (bm_email)
  getRequestsByBusinessManagerEmail(email: string): Observable<any[]> {
    return this.firestore.collection('maintenanceRequests', ref => ref.where('bm_email', '==', email)).valueChanges({ idField: 'id' });
  }

  updateRequest(id: string, data: any): Promise<void> {
    return this.firestore.doc(`maintenanceRequests/${id}`).update(data);
  }

  deleteRequest(id: string): Promise<void> {
    return this.firestore.doc(`maintenanceRequests/${id}`).delete();
  }

  updateRequestByIdAndEmail(requestId: string, email: string, data: any): Promise<void> {
    return this.firestore.collection('maintenanceRequests')
      .ref.where('id', '==', requestId)
      .where('serviceProvider.email', '==', email)
      .get()
      .then(snapshot => {
        if (!snapshot.empty) {
          const docRef = snapshot.docs[0].ref;
          return docRef.update(data);
        } else {
          throw new Error('No matching document found');
        }
      });
  }

  deleteServiceProviderByIdAndEmail(requestId: string, email: string): Promise<void> {
    return this.firestore.collection('maintenanceRequests')
      .ref.where('id', '==', requestId)
      .where('serviceProvider.email', '==', email)
      .get()
      .then(snapshot => {
        if (!snapshot.empty) {
          const docRef = snapshot.docs[0].ref;
          return docRef.update({
            'serviceProvider': firebase.firestore.FieldValue.delete()
          });
        } else {
          throw new Error('No matching document found');
        }
      });
  }
  
  getRequestsByServiceProviderEmail(email: string): Observable<any[]> {
    return this.firestore.collection('maintenanceRequests').valueChanges().pipe(
        map((requests: any[]) => {
            console.log('Requests:', requests); // Log all requests
            return requests.filter(request => {
                if (!request.serviceProvider || typeof request.serviceProvider !== 'object') {
                    console.warn('serviceProvider is not an object:', request);
                    return false; // Skip this request
                }
                return request.serviceProvider.email === email;
            });
        })
    );
}

  

}

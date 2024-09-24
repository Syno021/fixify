import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { MaintenanceRequestService } from '../services/maintenance-request.service';
import { AlertController } from '@ionic/angular';
import emailjs from 'emailjs-com';

@Component({
  selector: 'app-request-modal',
  templateUrl: './request-modal.component.html',
  styleUrls: ['./request-modal.component.scss'],
})
export class RequestModalComponent {
  @Input() request: any;
  amount: string = ''; // Initialize with an empty string
  selectedDate: string = ''; // Initialize with an empty string

  constructor(
    private modalController: ModalController,
    private alertController: AlertController,
    private maintenanceRequestService: MaintenanceRequestService
  ) {}

  ngOnInit() {
    // Set the offer amount to request.amount when the modal is opened
    this.amount = this.request.amount;
  }

  async deal() {
    try {
      await this.maintenanceRequestService.updateRequestByIdAndEmail(this.request.id, this.request.serviceProvider.email, {
        amount: this.amount,
        date: this.selectedDate,
        status: 'inProgress'
      });

      const emailParams = {
        email_to: this.request.serviceProvider.email,
        from_email: 'Fixify',
        subject: 'Fixify Account',
        message: `This email is to inform you that the offer of R${this.amount} has been offered for fixing the issue. Please reply to the following email: ${this.request.serviceProvider.email} for further discussions and completion of work`
      };

      await emailjs.send('service_1q81bzl','template_6j0vslg', emailParams, '0MDnRX4laSOlAEn54');

      this.showAlert('Success', 'Offer has been updated');
      this.modalController.dismiss();
    } catch (error) {
      console.error('Error updating document: ', error);
    }
  }

  async noDeal() {
    try {
      await this.maintenanceRequestService.deleteServiceProviderByIdAndEmail(this.request.id, this.request.serviceProvider.email);

      const emailParams = {
        email_to: this.request.serviceProvider.email,
        from_email: 'Fixify',
        subject: 'Fixify Account',
        message: 'This email is to inform you that the offer has been rejected for fixing the issue. Please refer to your dashboard for a new application. You can re-apply with a new offer if you are still interested.'
      };

      await emailjs.send('service_1q81bzl','template_6j0vslg', emailParams, '0MDnRX4laSOlAEn54');
      this.showAlert('Success', 'Offer has been rejected');

      this.modalController.dismiss();
    } catch (error) {
      console.error('Error updating document: ', error);
    }
  }

  closeModal() {
    this.modalController.dismiss();
  }

  async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }
}

import { Component, OnInit, Inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormControl, Validators } from '@angular/forms';

import { Visitor } from '../Class/Visitor';
import { SecurityService } from './security.service';
import { StorageService } from '../storage.service';
import { IUserRes } from '../Class/IUserRes';
import { IVisitorTypeAccess } from '../Class/IVisitorTypeAccess';
import { IResponse } from '../Class/IResponse';
import { IResponseImgVerify } from '../Class/IResponseImgVerify';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { IEmpRes } from '../Class/IEmpRes';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material';
import * as moment from 'moment';

@Component({
  selector: 'app-security',
  templateUrl: './security.component.html',
  styleUrls: ['./security.component.scss']
})
export class SecurityComponent implements OnInit {
  visitor: Visitor;
  userDetails: IUserRes;
  accessType = new FormControl();
  newVisitor: Visitor;
  visitorTypeAccess: IVisitorTypeAccess[] = [];
  email = new FormControl('', [Validators.required, Validators.email]);
  mobile = new FormControl('', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]);
  name = new FormControl('', [Validators.required]);
  photo = new FormControl('', [Validators.required]);
  reffered = new FormControl('', [Validators.required]);
  inTime = new FormControl('', [Validators.required]);
  outTime = new FormControl('', [Validators.required]);
  empId = new FormControl('', [Validators.required]);
  photoUploadError = false;
  selectedAccessType = '';
  isVisitorEmployee = false;
  isEmployeeDetailsFetched = false;
  webCamPic: any;

  constructor(private securityService: SecurityService,
              private storageService: StorageService,
              private sanitizer: DomSanitizer,
              private ngxLoader: NgxUiLoaderService,
              public dialog: MatDialog) { }

  ngOnInit() {
    // console.log(this.photo);
    if (!this.storageService.userDetails) {
      this.userDetails = JSON.parse(localStorage.getItem('userData'));
    } else {
      this.userDetails = this.storageService.userDetails;
    }
    this.visitorTypeAccess = this.userDetails.visitorTypeAccess;
    this.accessType.setValue(this.visitorTypeAccess[0].typeCode);
    this.initializeVisitor();
  }

  addData(dataType, event) {
    // console.log(event)
    this.newVisitor[dataType] = event.target.value;
  }

  addDate(dateType, event) {
    console.log(typeof (event.value));
    const time = event.value;
    console.log(time.format('YYYY-MM-DD HH:mm:ss'));
    this.newVisitor[dateType] = time.format('YYYY-MM-DD HH:mm:ss');
  }

  uploadImage(event) {
    console.log(this.photo);
    console.log(this.photo.value);
    const imgFile = event.target.files[0];
    this.validateFile(imgFile);
  }

  validateFile(file) {
    this.photoUploadError = false;
    console.log('start loader');

    const fileReader = new FileReader();
    fileReader.readAsDataURL(file);

    fileReader.onload = (e) => {
      const fileText = fileReader.result;
      const fileBase64 = (fileText as string).split(',')[1];
      // console.log(fileBase64);

      const filePayload = {
        image: fileBase64
      };
      this.getVerifiedImage(filePayload);
    };
  }

  getVerifiedImage(filePayload) {
    this.ngxLoader.start();
    this.securityService.validateImageBase64(filePayload)
      .subscribe((response: IResponseImgVerify) => {
        console.log(response);
        // this.photoId = response['image_id'];
        // self.showSpinner = false;
        this.newVisitor.photoId = response.image_id;
        this.newVisitor.photo = this.sanitizer.bypassSecurityTrustResourceUrl('data:image/jpg;base64,' + response.image_text);
        // alert('Image Validation successful');
        console.log('Image Validation successful');
        this.ngxLoader.stop();
      }, (httpError) => {
        console.log(httpError.error);
        // self.showSpinner = false;
        this.ngxLoader.stop();
        alert(httpError.error.error);
    });
  }

  submitRequest() {
    // console.log(this.email.valid , this.mobile.valid , this.name.valid , this.reffered.value , this.inTime.valid , this.outTime.valid , !this.photoUploadError);
    if (this.email.valid && this.mobile.valid && this.name.valid && this.reffered.value && this.inTime.valid && this.outTime.valid && !this.photoUploadError) {
      const visitorPayloadLst = [];
      this.ngxLoader.start();
      const visitorPayload = {
        Name: this.newVisitor.name,
        Email: this.newVisitor.email,
        Photo: this.newVisitor.photoId,
        Mobile: this.newVisitor.mobile,
        VisitorType: this.accessType.value,
        Reffered: this.newVisitor.reffered,
        IN: this.newVisitor.inTime,
        OUT: this.newVisitor.outTime
      };
      visitorPayloadLst.push(visitorPayload);
      console.log(visitorPayloadLst);

      this.securityService.requestGuestAccess(visitorPayloadLst)
        .subscribe((response: IResponse) => {
          if (response.status === 1) {
            alert(response.data[0].message);
            this.initializeVisitor();
          } else {
            alert(response.message);
          }
          console.log(response);
          // this.imageSource = this._sanitizer.bypassSecurityTrustResourceUrl('data:image/jpg;base64,'
          // + response['data']['Photo']);
          this.ngxLoader.stop();
        }, error => {
          this.ngxLoader.stop();
          alert('Sorry some error occured');
          console.log(error);
        });
    } else {
      this.photoUploadError = true;
    }
  }

  empIdEntered(event) {
    // console.log(event);
    this.newVisitor.enteredEmpId = event.target.value;
  }
  getEmployeeDetails() {
    if (this.newVisitor.enteredEmpId) {
      this.ngxLoader.start();
      this.securityService.fetchEmployeeDetails(this.newVisitor.enteredEmpId).subscribe((empRes: IEmpRes) => {
        console.log(empRes);
        if (this.accessType.value === 'EMPLOYEE') {
          this.newVisitor.name = empRes.name;
          this.newVisitor.email = empRes.email;
          this.newVisitor.mobile = empRes.mobile;
          this.newVisitor.photo = this.sanitizer.bypassSecurityTrustResourceUrl('data:image/jpg;base64,' + empRes.photo);
          this.newVisitor.photoId = empRes.photoId;
          this.newVisitor.inTime = moment().format('YYYY-MM-DD HH:mm:ss');

          this.name.setValue(empRes.name);
          this.email.setValue(empRes.email);
          this.mobile.setValue(empRes.mobile);
          this.photo.setValue(this.newVisitor.photo);
          this.inTime.setValue(this.newVisitor.inTime);
        }
        this.newVisitor.reffered = empRes.empId;
        this.reffered.setValue(empRes.empId);

        this.ngxLoader.stop();
        this.isEmployeeDetailsFetched = true;
      }, error => {
        alert(error.message);
        this.isEmployeeDetailsFetched = false;
        this.ngxLoader.stop();
      });
    }
  }

  visitorAccessChange(event) {
    console.log(event.source.value);
    const vType = event.source.value;
    if (vType === 'EMPLOYEE' || vType === 'FAMILY') {
      this.isVisitorEmployee = true;
      this.isEmployeeDetailsFetched = false;
      this.reffered.disable();
    } else {
      this.isVisitorEmployee = false;
      this.isEmployeeDetailsFetched  = true;
      this.reffered.enable();
    }
  }

  getEmpIdErrorMessage() {
    return this.empId.hasError('required') ? 'Employee Id cannot be empty' : '';
  }
  getEmailErrorMessage() {
    return this.email.hasError('required') ? 'Email cannot be empty' :
      this.email.hasError('email') ? 'Not a valid email' : '';
  }
  getMobileErrorMessage() {
    return this.mobile.hasError('required') ? 'Mobile cannot be empty' :
      this.mobile.hasError('pattern') ? 'Not a valid Mobile no.' : '';
  }
  getNameErrorMessage() {
    return this.name.hasError('required') ? 'Name cannot be empty' : '';
  }
  getPhotoErrorMessage() {
    return this.photo.hasError('required') ? 'Photo cannot be empty' : '';
  }
  getRefferedErrorMessage() {
    return this.reffered.hasError('required') ? 'Reffered cannot be empty' : '';
  }
  getInTimeErrorMessage() {
    return this.inTime.hasError('required') ? 'In Time cannot be empty' : '';
  }
  getOutTimeErrorMessage() {
    return this.outTime.hasError('required') ? 'Out Time cannot be empty' : '';
  }

  initializeVisitor() {
    this.newVisitor = new Visitor();
  }
  openDialog(): void {
    const dialogRef = this.dialog.open(DialogOverviewExampleDialog, {
      width: '600px',
      height: '576px',
      data: {}
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
      console.log(result);
      this.webCamPic = result;
      if (result) {
        const filePayload = {
          image: result
        };
        console.log(filePayload)
        this.getVerifiedImage(filePayload);
      }
    });
  }
}


import {Observable, Subject} from 'rxjs';


@Component({
  selector: 'dialog-overview-example-dialog',
  templateUrl: 'dialog-overview-example-dialog.html',
})
export class DialogOverviewExampleDialog {
  webcamImage = null;
  private trigger: Subject<void> = new Subject<void>();
  constructor(
    public dialogRef: MatDialogRef<DialogOverviewExampleDialog>,
    @Inject(MAT_DIALOG_DATA) public data) {}

  onNoClick(): void {
    this.dialogRef.close();
  }

  onTakePhotoClick() {
    this.trigger.next();
  }

  handleImage(webcamImage) {
    // console.log('received webcam image', webcamImage);
    // console.log(webcamImage)
    this.webcamImage = webcamImage;
    this.data.webCamPic = webcamImage;
    this.dialogRef.close(webcamImage.imageAsBase64);
  }
  public triggerSnapshot(): void {
    this.trigger.next();
  }

  public get triggerObservable(): Observable<void> {
    return this.trigger.asObservable();
  }
}

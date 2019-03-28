import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormControl, Validators } from '@angular/forms';
import {MatDatepickerInputEvent} from '@angular/material/datepicker';

import { Visitor } from '../Class/Visitor';
import { EmployeeService } from './employee.service';
import { StorageService } from '../storage.service';
import { IUserRes } from '../Class/IUserRes';
import { IVisitorTypeAccess } from '../Class/IVisitorTypeAccess';
import { IResponse } from '../Class/IResponse';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { IResponseImgVerify } from '../Class/IResponseImgVerify';


@Component({
  selector: 'app-employee',
  templateUrl: './employee.component.html',
  styleUrls: ['./employee.component.scss']
})
export class EmployeeComponent implements OnInit {
  visitor: Visitor;
  userDetails: IUserRes;
  // selectedAccessType: string;
  dependents = new FormControl();
  accessType = new FormControl();
  photoId: string;
  dependentsLst: Visitor[] = [];
  existingDependentsLst: Visitor[];
  visitorTypeAccess: IVisitorTypeAccess[] = [];
  // { name: 'TestName', id: 12, email: 'a@b.c', mobile: '1234567890', photo: 'assets/images/ccc-bg.jpg' },
  // { name: 'New Test', id: 10, email: 'a@b.c', mobile: '1234567890', photo: '' }
  email = new FormControl('', [Validators.required, Validators.email]);
  selectedVisitorType = '';

  constructor(private empService: EmployeeService,
              private storageService: StorageService,
              private sanitizer: DomSanitizer,
              private ngxLoader: NgxUiLoaderService) {
    this.visitor = new Visitor();
  }

  ngOnInit() {
    if (!this.storageService.userDetails) {
      this.userDetails = JSON.parse(localStorage.getItem('userData'));
    } else {
      this.userDetails = this.storageService.userDetails;
    }
    this.visitorTypeAccess = this.userDetails.visitorTypeAccess;
    this.accessType.setValue(this.visitorTypeAccess[0].typeCode);
    this.existingDependentsLst = this.userDetails.employeeFamily;
    this.existingDependentsLst.forEach(visitor => {
      visitor.photo = this.sanitizer.bypassSecurityTrustResourceUrl('data:image/jpg;base64,' + visitor.photo);
    });
    // this.dependentsLst.push(this.visitor);
    this.initializeVisitorLst();
  }

  getEmailErrorMessage() {
    return this.email.hasError('required') ? 'Email cannot be empty' :
      this.email.hasError('email') ? 'Not a valid email' : '';
  }

  addNewVisitor() {
    if (this.dependentsLst.length < 6) {
      const newVisitor = new Visitor();
      this.dependentsLst.push(newVisitor);
    } else {
      return false;
    }
  }

  dependentsSelected() {
    this.dependentsLst = this.existingDependentsLst.slice();
  }
  // accessTypeSelected() {
  //   this.selectedAccessType = this.existingDependentsLst.slice();
  // }

  uploadImage(event, index) {
    const imgFile = event.target.files[0];
    this.validateFile(imgFile, index);
  }

  validateFile(file, index) {
    // let self = this;
    // self.showSpinner = true;
    // let file = (<HTMLInputElement>document.getElementById('visitorImage')).files[0];
    console.log('start loader');
    this.ngxLoader.start();
    console.log('index: ' + index);

    const fileReader = new FileReader();
    fileReader.readAsDataURL(file);

    fileReader.onload = (e) => {
      const fileText = fileReader.result;
      const fileBase64 = (fileText as string).split(',')[1];
      // console.log(fileBase64);

      const filePayload = {
        image: fileBase64
      };

      this.empService.validateImageBase64(filePayload)
        .subscribe((response: IResponseImgVerify) => {
          console.log(response);
          // this.photoId = response['image_id'];
          // self.showSpinner = false;
          this.dependentsLst[index].photoId = response.image_id;
          this.dependentsLst[index].photo = this.sanitizer.bypassSecurityTrustResourceUrl('data:image/jpg;base64,' + response.image_text);
          // this.sanitizer.bypassSecurityTrustResourceUrl('data:image/jpg;base64,' + visitor.photo);
          // alert('Image Validation successful');
          console.log('Image Validation successful');
          this.ngxLoader.stop();
        }, (httpError) => {
          console.log(httpError.error);
          // self.showSpinner = false;
          this.ngxLoader.stop();
          alert(httpError.error.error);
        });
    };
  }
  addData(index, dataType, event) {
    // console.log(event)
    this.dependentsLst[index][dataType] = event.target.value;
  }

  addDate(index, dateType, event) {
    const time = event.value;
    // console.log(time.format('YYYY-MM-DD HH:mm:ss'));
    this.dependentsLst[index][dateType] = time.format('YYYY-MM-DD HH:mm:ss');
  }

  submitRequest() {
    const visitorPayloadLst = [];
    this.ngxLoader.start();
    this.dependentsLst.forEach(dependent => {
      const visitorPayload = {
        Name: dependent.name,
        Email: dependent.email,
        Photo: dependent.photoId,
        Mobile: dependent.mobile,
        VisitorType: this.accessType.value,
        Reffered: this.userDetails.userId,
        IN: dependent.inTime,
        OUT: dependent.outTime
      };
      visitorPayloadLst.push(visitorPayload);
      // console.log(dependent.inTime);
    });
    console.log(visitorPayloadLst);

    this.empService.requestVisitorAccess(visitorPayloadLst)
      .subscribe((response: IResponse) => {
        if (response.status === 1) {
          this.initializeVisitorLst();
        }
        alert(response.data[0].message);
        console.log(response);
        // this.imageSource = this._sanitizer.bypassSecurityTrustResourceUrl('data:image/jpg;base64,'
        // + response['data']['Photo']);
        this.ngxLoader.stop();
      }, error => {
        this.ngxLoader.stop();
        alert('Sorry some error occured');
        console.log(error);
      });
  }
  initializeVisitorLst() {
    this.dependentsLst = [];
    const newVisitor = new Visitor();
    this.dependentsLst.push(newVisitor);
  }
}

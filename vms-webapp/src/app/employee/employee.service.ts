import { Injectable } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { CookieService } from 'ngx-cookie-service';


@Injectable({
  providedIn: 'root'
})
export class EmployeeService {

  constructor(private http: HttpClient, private cookieService: CookieService) { }

  validateImageBase64(filePayload) {

    const httpOptions = {
      headers: new HttpHeaders().set('Content-Type', 'application/json')
        .set('access-token', this.cookieService.get('token'))
    };

    return this.http.post(environment.mlUrl + '/upload-photo-b64', filePayload, httpOptions);
  }

  requestVisitorAccess(visitorPayload) {

    const httpOptions = {
      headers: new HttpHeaders().set('Content-Type', 'application/json')
        .set('access-token', this.cookieService.get('token'))
    };

    return this.http.post(environment.dataUrl + '/web/addVisitorEmployee', visitorPayload, httpOptions);
  }
}

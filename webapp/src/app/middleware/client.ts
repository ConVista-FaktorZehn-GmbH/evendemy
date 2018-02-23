import { Injectable } from '@angular/core';
import { Http, Headers, Request, Response, URLSearchParams } from '@angular/http';
import { User } from './../model/user';
import { Meeting } from './../model/meeting';
import { MeetingUser } from './../model/meeting_user';
import { Comment } from './../model/comment';
import 'rxjs/Rx';
import { Observable } from 'rxjs/Observable';
import { ConfigService } from 'ng2-config';
import { Store } from '@ngrx/store';
import { AppState } from '../appState';
import { InitMeetings, AddMeeting } from '../actions/meetings.actions';
import { AttendingUser } from '../model/AttendingUser';


@Injectable()
export class Client {
    private url = this.config.getSettings().backend_url;

    constructor(private http: Http, private config: ConfigService, private store: Store<AppState>) { }

    private createHeaders(): Headers {
        const headers = new Headers();
        headers.append('Authorization', localStorage.getItem('token'));
        headers.append('Content-Type', 'application/json');
        return headers;
    }

    public ping() {
        const headers = this.createHeaders();
        const url = this.url + '/ping';
        return this.http.get(url, { headers: headers }).map(res => res.json());
    }

    public loginUser(username: string, password: string) {
        const token = 'Basic ' + window.btoa(username + ':' + password);
        const headers = new Headers();
        headers.append('Authorization', token);
        headers.append('Content-Type', 'application/json');
        const url = this.url + '/auth';
        return this.http.post(url, {}, { headers: headers }).map(res => res.json()).map((res) => {
            localStorage.setItem('token', token);
            localStorage.setItem('username', username);
            return res;
        });
    }

    public logoutUser() {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
    }

    public isLoggedIn() {
        return localStorage.getItem('token') !== undefined && localStorage.getItem('token') !== null;
    }

    public getLoggedInUsername() {
        return localStorage.getItem('username');
    }

    public getLoggedInLdapUser() {
        const headers = this.createHeaders();
        const url = this.url + '/auth';
        return this.http.get(url, { headers: headers }).map(res => res.json());
    }

    public getMeetingByMId(mid: number) {
        const headers = this.createHeaders();
        const url = this.url + '/meeting/' + mid;
        return this.http.get(url, { headers: headers }).map(res => res.json());
    }

    public getUserByUsername(username: string) {
        const headers = this.createHeaders();
        const url = this.url + '/user/' + username;
        return this.http.get(url, { headers: headers }).map(res => res.json());
    }

    public getAllAttendingUsers(mid: string): Observable<AttendingUser[]> {
        const headers = this.createHeaders();
        const url = this.url + '/meeting/' + mid + '/attendees';
        const params: URLSearchParams = new URLSearchParams();

        return this.http.get(url, { search: params, headers: headers }).map(res => res.json());
    }

    public getMyMeetings(username: string) {
        const headers = this.createHeaders();
        const url = this.url + '/my-meetings/' + username;
        const params: URLSearchParams = new URLSearchParams();

        return this.http.get(url, { search: params, headers: headers }).map(res => res.json());
    }

    public attendMeeting(mid: number, username: String) {
        const headers = this.createHeaders();
        if (mid !== undefined && username !== undefined) {
            const url = this.url + '/meeting/' + mid + '/attendee/' + username + '/attend';
            return this.http.put(url, {}, { headers: headers }).map(res => res.json());
        }
        return null;
    }

    public rejectAttendingMeeting(mid: number, username: String) {
        const headers = this.createHeaders();
        if (mid !== undefined && username !== undefined) {
            const url = this.url + '/meeting/' + mid + '/attendee/' + username + '/attend';
            return this.http.delete(url, { headers: headers }).map(res => res.json());
        }
        return null;
    }

    public confirmAttendeeToMeeting(mid: number, username: String) {
        const headers = this.createHeaders();
        if (mid !== undefined && username !== undefined) {
            const url = this.url + '/meeting/' + mid + '/attendee/' + username + '/confirm';
            return this.http.put(url, {}, { headers: headers }).map(res => res.json());
        }
        return null;
    }

}

import { Visitor } from './Visitor';
import { IVisitorTypeAccess } from './IVisitorTypeAccess';

export interface IUserRes {
    userId: number;
    userName: string;
    email: string;
    token: string;
    userRole: string;
    visitorTypeAccess: IVisitorTypeAccess[];
    employeeFamily: Visitor[];
}

import { IUserRes } from './IUserRes';

export interface IResponse {
    status: number;
    message: string;
    data: IUserRes;
}

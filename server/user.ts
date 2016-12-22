import { Animal, Role } from './types';


export default class User{
	id: number;
	name: string;
	logoUrl: string;

	animal: Animal;
	role: Role;
}
import { Animal, Role } from './types';


export default class User{
	id: string;
	name: string;
	logoUrl: string;

	animal: Animal;
	role: Role;
}
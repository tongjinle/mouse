import * as _ from 'underscore';

export default class Room {
	roomId: string;
	userIdList: string[];
	constructor(roomId:string) {
		// code...
		this.roomId = roomId;
		this.userIdList = [];
	}


	addUser(userId: string): boolean {
		if (_.find(this.userIdList, uid => uid == userId)) {
			return false;
		}
		this.userIdList.push(userId);
		return true;
	}

	removeUser(userId: string): boolean {
		for(let i = 0; i < this.userIdList.length;i++){
			if(this.userIdList[i]==userId){
				this.userIdList.splice(i, 1);
				return true;
			}
		}

		return false;
	}







}
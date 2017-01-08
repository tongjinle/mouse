export enum Role {
	guess,
	roll
}


export enum Score {
	lost,
	win
}


export enum Animal {
	cat,
	dog
}

export interface Position {
	x: number;
	y: number;
}

export class RequestType {
	static getUserListInRoom:string = 'getUserListInRoom';
	static enterRoom: string = 'enterRoom';
	static leaveRoom: string = 'leaveRoom';
	static putMouse: string = 'putMouse';
	static rollCup: string = 'rollCup';
	static guess: string = 'guess';
	static publishScore: string = 'publishScore';

}

export class PushType{
	static ongetUserListInRoom:string = 'ongetUserListInRoom';
	static onenterRoom: string = 'onenterRoom';
	static onleaveRoom: string = 'onleaveRoom';
	static onputMouse: string = 'onputMouse';
	static onrollCup: string = 'onrollCup';
	static onguess: string = 'onguess';
	static onpublishScore: string = 'onpublishScore';
	static ongameStart: string = 'ongameStart';
}


/* 数据协议 */
export interface EnterRoomData{
	gameId: string,
	userId: string,
	username: string,
	ext: {
		logoUrl: string
	}
}


export interface PutMouseData{
	cupIndex:number;
}

export interface GuessData{
	cupIndex:number;
}


export interface RollCupData{
	posiList:Position[]
}
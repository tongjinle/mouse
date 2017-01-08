import * as _ from 'underscore';
import * as SocketIO from 'socket.io';
import * as Http from 'http';
import {
	Animal,
	Score,
	RequestType,
	PushType,

	EnterRoomData,
	PutMouseData,
	GuessData,
	RollCupData
} from './types';
import Room from './room';
import Game from './game';
import User from './user';
import CONFIG from './config';

type Info = { rid: string, gid: string, uid: string };

class App {
	// 记录映射信息
	private dict: { [sid: string]: EnterRoomData };

	// 游戏实例列表
	gameList: Game[];
	constructor() {
		this.gameList = [];
		this.dict = {};

		let app = Http.createServer();
		let io = SocketIO(app);


		app.listen(3000, () => {
			console.log('..............');
			console.log('..............');
			console.log('..............');
			console.log('..............');
			console.log('..............');
			console.log('..............');
			console.log('..............');
			console.log('..............');
			console.log('..............');
			console.log('..............');
			console.log('..............');
			console.log(new Date().toLocaleString());
		});
		this.bind(io);
	}

	private joinRoom(sid: string, data: EnterRoomData) {
		this.dict[sid] = this.dict[sid] || data;
	}

	private leaveRoom(sid: string) {

		delete this.dict[sid];
	}

	private getRoom(sid: string): EnterRoomData {

		return this.dict[sid];
	}

	private getUserListInRoom(gameId: string): EnterRoomData[] {
		let userList: EnterRoomData[] = [];
		_.each(this.dict, (us, sid) => {
			if (us.gameId == gameId) {
				userList.push(us);
			}
		});
		return userList;
	}


	private getGame(sid: string): Game {
		return _.find(this.gameList, ga => ga.id == this.getRoom(sid).gameId);
	}

	private getUserId(sid: string): string {
		return this.getRoom(sid).userId;
	}

	bind(io: SocketIO.Server) {
		io.on('connection', (so) => {
			// 获取房间
			so.on(RequestType.getUserListInRoom, (data: { gameId: string }) => {
				let {gameId} = data;
				let userList = this.getUserListInRoom(gameId);
				io.to(gameId).emit(PushType.ongetUserListInRoom, { userList });

			});
			// 进入房间
			so.on(RequestType.enterRoom, (data: EnterRoomData) => {
				let sid = so.id;
				let gameId = data.gameId;
				// 记录sid对应的信息
				this.joinRoom(sid, data);
				so.join(data.gameId);

				let userList = this.getUserListInRoom(gameId);
				io.to(gameId).emit(PushType.onenterRoom, {userList});

				// 查看游戏能否开始
				let room = this.getRoom(sid);
				let list = this.getUserListInRoom(gameId);
				let userCount: number = list.length;
				if (userCount == CONFIG.userCount) {
					let userList = _.map(list, (d, index) => {
						let us = new User();
						us.id = d.userId;
						us.name = d.username;
						us.logoUrl = d.ext.logoUrl;
						us.animal = index == 0 ? Animal.cat : Animal.dog;
						return us;
					});
					let ga = new Game(gameId, userList);
					this.gameList.push(ga);

					// 广播"游戏开始"
					io.to(gameId).emit(PushType.ongameStart, {userList});
				}
			});

			so.on(RequestType.putMouse, (data: PutMouseData) => {
				let ga = this.getGame(so.id);
				let userId = this.getUserId(so.id);
				let cupIndex = data.cupIndex;
				let flag = ga.putMouse(userId, cupIndex);

				let gameId = ga.id;

				io.to(gameId).emit(PushType.onputMouse, { flag });
			});

			so.on(RequestType.rollCup, (data: RollCupData) => {
				let ga = this.getGame(so.id);
				let userId = this.getUserId(so.id);
				let posiList = data.posiList;
				let flag = ga.rollCup(userId, posiList);

				let gameId = ga.id;

				io.to(gameId).emit(PushType.onrollCup, { flag });

			});

			so.on(RequestType.guess, (data: GuessData) => {
				let ga = this.getGame(so.id);
				let userId = this.getUserId(so.id);
				let cupIndex = data.cupIndex;
				let flag = ga.guessMouse(userId, cupIndex);

				let gameId = ga.id;

				io.to(gameId).emit(PushType.onguess, {
					cupIndex,
					isCorrect: ga.scoreList[ga.scoreList.length - 1] == Score.win
				});

				// 是否要全部推送总分
				if (ga.isOver) {
					let userIdList = ga.userList.map(us => us.id);
					let result;
					so.emit(PushType.onpublishScore, {
						userIdList,
						result
					});
				}
			});

			so.on('disconnect', () => {

				let room = this.getRoom(so.id);

				this.leaveRoom(so.id);
				if (room) {

					let gameId = room.gameId;
					let userId = room.userId;

					io.to(gameId).emit(PushType.onleaveRoom, {
						userId
					});
				}
			});

		});
	}


}



let app = new App();






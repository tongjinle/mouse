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


class App {
	private gameDict: { [sid: string]: any };
	private userInfoDict: { [sid: string]: any };

	private waitRoomDict;
	gameList: Game[];
	constructor() {
		this.waitRoomDict = {}
		this.gameList = [];

		let app = Http.createClient();
		let io = SocketIO(app);


		app.listen(3000);
		this.bind(io);
	}

	bind(io: SocketIO.Server) {
		io.on('connection', (so) => {
			// 进入房间
			so.on(RequestType.enterRoom, (data: EnterRoomData) => {
				let ro = this.waitRoomDict[data.gameId] = this.waitRoomDict[data.gameId] = [];
				ro.push(data);

				so.join(data.gameId);
				so.emit(PushType.onenterRoom, data);

				// 查看游戏能否开始
				if (ro.length == CONFIG.userCount) {
					let userList = _.map(ro, (d, index) => {
						let us = new User();
						us.animal = index == 0 ? Animal.cat : Animal.dog;
						return us;
					});
					let ga = new Game(data.gameId, userList);

					so.emit(PushType.ongameStart, { userList: ga.userList });
				}
			});

			so.on(RequestType.putMouse, (data: PutMouseData) => {
				let ga = this.getGame(so.id);
				let userId = this.getUserId(so.id);
				let cupIndex = data.cupIndex;
				let flag = ga.putMouse(userId, cupIndex);

				so.emit(PushType.onputMouse, { flag });
			});

			so.on(RequestType.rollCup, (data: RollCupData) => {
				let ga = this.getGame(so.id);
				let userId = this.getUserId(so.id);
				let posiList = data.posiList;
				let flag = ga.rollCup(userId, posiList);

				so.emit(PushType.onrollCup, { flag });

			});

			so.on(RequestType.guess, (data: GuessData) => {
				let ga = this.getGame(so.id);
				let userId = this.getUserId(so.id);
				let cupIndex = data.cupIndex;
				let flag = ga.guessMouse(userId,cupIndex);

				so.emit(PushType.onguess,{
					cupIndex,
					isCorrect:ga.scoreList[ga.scoreList.length-1] == Score.win
				});

				// 是否要全部推送总分
				if(ga.isOver){
					let userIdList = ga.userList.map(us=>us.id);
					let result;
					so.emit(PushType.onpublishScore,{
						userIdList,
						result
					});
				}
			});

			so.on('disconnection', () => { });

		});
	}

	// 查找或者新建room
	private getGame(sid: string): Game {
		let ga: Game;

		return ga;
	}


	private getUserId(sid: string): string {
		let userId: string;
		return userId;
	}


}



let app = new App();






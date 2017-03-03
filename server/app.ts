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
    TouchCupData,
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
    constructor(port:number) {
        this.gameList = [];
        this.dict = {};

        let app = Http.createServer();
        let io = SocketIO(app);


        app.listen(port, () => {
            let count = 10;
            while(count--){
                console.log('..............');
                
            }
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
        let ro = this.getRoom(sid);

        return ro ? _.find(this.gameList, ga => ga.id == ro.gameId) : undefined;
    }

    private delGame(gid:string){
    	this.gameList = _.filter(this.gameList,ga => ga.id!=gid);
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
                io.to(gameId).emit(PushType.onenterRoom, { userList });

                console.log('gameLen',this.gameList.length);

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
                    // console.log(userList);
                    this.gameList.push(ga);

                    // 广播"游戏开始"
                    io.to(gameId).emit(PushType.ongameStart, { userList });
                }
            });

            // notify
            so.on('notify',(data:{type:string,data:any})=>{
                let ga = this.getGame(so.id);
                if(!ga){
                    return;
                }
                let gameId = ga.id;
                io.to(gameId).emit('onnotify',data);

            });

            so.on(RequestType.putMouse, (data: PutMouseData) => {
                let ga = this.getGame(so.id);
                if(!ga){
                    return;
                }

                // 防止重复的putMouse
                if(ga.cupIndex!==undefined){
                	return;
                }

                let userId = this.getUserId(so.id);
                let cupIndex = data.cupIndex;
                let flag = ga.putMouse(userId, cupIndex);
                let gameId = ga.id;

                io.to(gameId).emit(PushType.onputMouse, { flag, cupIndex });
            });

            so.on(RequestType.touchCup, (data: TouchCupData) => {
                let ga = this.getGame(so.id);
                if(!ga){
                    return;
                }
                let gameId = ga.id;
                let flag = true;
                let {posi} = data;
                io.to(gameId).emit(PushType.ontouchCup, { flag, posi });
            });

            so.on(RequestType.rollCup, (data: RollCupData) => {

                let ga = this.getGame(so.id);
                if(!ga){
                    return;
                }
                let userId = this.getUserId(so.id);
                let {posi} = data;

                let flag = true;

                let gameId = ga.id;
                io.to(gameId).emit(PushType.onrollCup, { flag, posi });

            });

            so.on(RequestType.releaseCup,()=>{
            	let ga = this.getGame(so.id);
                if(!ga){
                    return;
                }

                let gameId = ga.id;
                let flag = true;
                io.to(gameId).emit(PushType.onreleaseCup, { flag });
            });

            so.on(RequestType.guess, (data: GuessData) => {
                let ga = this.getGame(so.id);
                if(!ga){
                    return;
                }

                // 防止重复guess
                if(ga.guessCupIndex!==undefined){
                	return;
                }

                let userId = this.getUserId(so.id);
                let cupIndex = data.cupIndex;
                let flag = ga.guessMouse(userId, cupIndex);

                let gameId = ga.id;

                io.to(gameId).emit(PushType.onguess, {
                    cupIndex,
                    isCorrect: flag
                });

                // 是否要全部推送总分
                if (ga.isOver) {
                    let userIdList = ga.userList.map(us => us.id);
                    let result = ga.countScore();
                    console.log({result});

                    io.to(gameId).emit(PushType.onpublishScore, result);
                    this.delGame(gameId);
                }else{
                    let scoreRound:number = ga.countScore().scoreRound;
                    console.log({scoreRound});
                    let data ={
                        refreshScore:ga.roundCount >= 6 && ga.roundCount%2==0,
                        scoreRound
                    };
                    
                    io.to(gameId).emit(PushType.onnextRound,data);
                }

            });

            so.on('disconnect', () => {
            	console.log('disconnect....');
               	let sid = so.id;
                let room = this.getRoom(sid);

                // 
                let ga = this.getGame(sid);
                if (ga) {
                    let gameId = ga.id;
                    this.delGame(gameId);
                    this.gameList = this.gameList.filter(ga => ga.id != gameId);
                    console.log('ondisconnet,game len:',this.gameList.length);
                    // 删除另一个人的room信息
                    _.each(this.dict, (ro, sid) => {
                        if (ro.gameId == gameId) {
                            delete this.dict[sid];
                        }
                    });

                }

                this.leaveRoom(sid);

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



let app = new App(CONFIG.port);






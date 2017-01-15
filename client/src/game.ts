/// <reference path="../libs/underscore/underscore.d.ts" />

namespace Client {
    export class Game {

        currUser: User;
        userList: User[];
        cupList: Cup[];
        hubList: Hub[];
        hand: Hand;
        tip: Tip;

        private so: SocketIOClient.Socket;

        // 游戏状态机
        private _status: GameStatus;
        public get status(): GameStatus {
            return this._status;
        }
        public set status(v: GameStatus) {
            console.log('status:', GameStatus[this.status], GameStatus[v]);
            this._status = v;
            // 必须放在前面,否则会次序错乱
            // 比如beforeRolling -> rolling
            this.binder.refresh(GameStatus[v]);

            let dict: { [stat: number]: () => void } = {};
            // ********************************************************************************************************************************************
            // beforePutMouse
            // ********************************************************************************************************************************************
            dict[GameStatus.beforePutMouse] = () => {
                this.roller.status = UserStatus.beforePutMouse;
                this.guesser.status = UserStatus.beforeWatching;

                if (this.currUser.role == Role.roller) {
                    // show tips
                    this.tip.showMsg(CONFIG.PUT_MOUSE_TIP, CONFIG.PUT_MOUSE_TIP_DURATION, () => { });
                   
                    // 超时没有放置mouse,就会随机在一个cup中放置mouse
                    this.currHub.runTimer(CONFIG.PUT_MOUSE_DURATION, () => {
                        if (UserStatus.beforePutMouse == this.roller.status) {
                            let cupIndex = Math.floor(Math.random() * this.cupList.length);
                            this.reqPutMouse(this.cupList[cupIndex].index);
                        }
                    });
                }else {
                    this.currHub.runTimer(CONFIG.PUT_MOUSE_DURATION, () => {
                    }); 
                }
            };

            // ********************************************************************************************************************************************
            // beforeRolling
            // ********************************************************************************************************************************************
            dict[GameStatus.beforeRolling] = () => {
                this.status = GameStatus.rolling;
            };

            // ********************************************************************************************************************************************
            // rolling
            // ********************************************************************************************************************************************
            dict[GameStatus.rolling] = () => {
                this.roller.status = UserStatus.beforeRolling;
                this.guesser.status = UserStatus.watching;

                // this.stage.touchEnabled = true;
                // console.log(this.stage.touchEnabled+'0000');
                window['s1'] = this.stage;
                this.stage.addEventListener(egret.TouchEvent.TOUCH_BEGIN,()=>{
                    console.log('123');
                },null);

                // 提示
                if (this.roller == this.currUser) {
                    this.tip.showMsg(CONFIG.ROLL_TIP, CONFIG.ROLL_TIP_DURATION, () => { });
                }
                

                this.currHub.runTimer(CONFIG.ROLL_DURATION, () => {
                    if (Role.roller == this.currUser.role && UserStatus.rolling == this.currUser.status) {
                        this.reqReleaseCup();
                    }
                    this.status = GameStatus.afterRolling;
                });
            };


            // ********************************************************************************************************************************************
            // afterRolling
            // ********************************************************************************************************************************************
            dict[GameStatus.afterRolling] = () => {
                this.roller.status = UserStatus.afterRolling;
                this.guesser.status = UserStatus.afterWatching;


                this.cupList.forEach(cu => {
                    cu.cupSp.touchEnabled = true;
                    cu.cupSp.addEventListener(egret.TouchEvent.TOUCH_BEGIN, (event: egret.TouchEvent) => {
                        if (Role.guesser != this.currUser.role) {
                            return;
                        }

                        this.guessMouse(cu.index);
                        this.reqGuess(cu.index);
                    }, this);
                });

                // this.tip.showMsg()
            };


            dict[v]();
        }


        public get roller(): User {
            return _.find(this.userList, us => us.role == Role.roller);
        }

        public get guesser(): User {
            return _.find(this.userList, us => us.role == Role.guesser);
        }

        public get currHub(): Hub {
            return _.find(this.hubList, hu => hu.user == this.currUser);
        }

        // private halo: egret.Bitmap;
        private currCup: Cup;
        private currCupPosi: { x: number, y: number };

        private stage: egret.Stage;
        private sh: egret.SpriteSheet;

        private binder:Binder;

        constructor(stage: egret.Stage, userList: User[], currUserId) {
            this.stage = stage;
            this.sh = RES.getRes('basic_png');

            this.userList = userList;
            this.cupList = [];
            this.hubList = [];

            this.currUser = _.find(this.userList, us => us.userId == currUserId);

            this.createScene();

            this.bind();


            
        }

        createScene() {
            this.createBg();
            for (let user of this.userList) {
                this.createUser(user);

            }
            this.createCups();

            // mock
            // this.mockPutMouse();

            this.createHubs();
            // mock
            // this.mockScore();
            // this.mockHubRuntimer();

            this.createHand();

            this.createTip();
        }


        bind() {
            let binder = this.binder = new Binder();
            this.cupList.forEach((cu, i) => {
                let sp = cu.cupSp;
                sp.touchEnabled = true;

                binder.watch({
                    beWatched: sp,
                    eventname: egret.TouchEvent.TOUCH_BEGIN,
                    handler: (e: egret.TouchEvent) => {
                        if (this.currUser != this.roller || UserStatus.beforePutMouse != this.roller.status) {
                            return;
                        }
                        this.reqPutMouse(cu.index);
                    },
                    context: this,
                    onStatus: GameStatus[GameStatus.beforePutMouse],
                    offStatus: Binder.OTHER_STATUS
                });

            });


            // 点击某个杯子,显示出HALO
            // 开始roll
            binder.watch({
                beWatchType: Binder.BEWATCHED_TYPE.stage,
                beWatched: this.stage,
                eventname: egret.TouchEvent.TOUCH_BEGIN,
                handler: (e: egret.TouchEvent) => {
                    console.log('*******');
                    if (this.currUser != this.roller) {
                        return;
                    }

                    if (this.roller.status != UserStatus.beforeRolling) {
                        return;
                    }

                    let x = e.stageX;
                    let y = e.stageY;
                    var hand = this.hand;
                    hand.toggle(false);
                    // 探测hand是否碰到了cup

                    let cu = this.getCupByPosi({ x, y });
                    if (cu) {
                        this.reqTouchCup({ x, y });
                        // this.touchCup({ x, y });
                    }

                },
                context: this,
                onStatus: GameStatus[GameStatus.rolling],
                offStatus: Binder.OTHER_STATUS
            });


            // 点击某个cup,进入ROLLING状态
            binder.watch({
                beWatchType: Binder.BEWATCHED_TYPE.stage,
                beWatched: this.stage,
                eventname: egret.TouchEvent.TOUCH_MOVE,
                handler: (e: egret.TouchEvent) => {
                    if (this.currUser != this.roller) {
                        return;
                    }

                    if (this.roller.status != UserStatus.rolling) {
                        return;
                    }

                    // this.currCup = _.find(this.cupList,cu=>cu.hasMouse);
                    this.reqRollCup({ x: e.stageX, y: e.stageY });



                },
                context: this,
                onStatus: GameStatus[GameStatus.rolling],
                offStatus: Binder.OTHER_STATUS
            });

            // roll结束
            binder.watch({
                beWatchType: Binder.BEWATCHED_TYPE.stage,
                beWatched: this.stage,
                eventname: egret.TouchEvent.TOUCH_END,
                handler: (e: egret.TouchEvent) => {
                    if (this.roller.status != UserStatus.rolling) {
                        return;
                    }

                    this.reqReleaseCup();
                },
                context: this,
                onStatus: GameStatus[GameStatus.rolling],
                offStatus: Binder.OTHER_STATUS
            });

        }

        createSocket(so: SocketIOClient.Socket) {
            this.so = so;

            // 绑定putmouse
            so.on('onputMouse', (data: { flag: boolean, cupIndex: number }) => {
                let {flag, cupIndex} = data;
                if (flag) {
                    this.putMouse(this.cupList[cupIndex]);
                    this.currHub.clearTimer();
                    this.status = GameStatus.beforeRolling;

                }

            });

            // touchCup
            so.on('ontouchCup',(data:{flag:boolean,posi:{x:number,y:number}})=>{
                // if(Role.roller == this.currUser.role){return;}

                let {flag,posi}=data;
                this.touchCup(posi);
            });

            so.on('onrollCup', (data:  { flag:boolean,posi: { x: number, y: number }}) => {
                // if (Role.roller == this.currUser.role) {
                //     return;
                // }
                let {posi} = data;
                this.rollCup(posi.x);
                
            });

            so.on('onreleaseCup',()=>{
               this.releaseCup();
            });

            so.on('onguess', (data: { cupIndex: number, isCorrect: boolean }) => {

                if (Role.roller == this.currUser.role) {
                    this.guessMouse(data.cupIndex);
                }


                // 显示对错

            });
        }



        start() {
            this.status = GameStatus.beforePutMouse;
        }

        // ********************************************************************************************************************************************
        // request
        // ********************************************************************************************************************************************
        reqPutMouse(cupIndex: number) {
            this.so.emit('putMouse', { cupIndex });
        }

        reqTouchCup(posi:{x:number,y:number}){
            this.so.emit('touchCup',{posi});
        }

        reqRollCup(posi: { x: number, y: number }) {
            this.so.emit('rollCup', { posi });
        }

        reqReleaseCup(){
            this.so.emit('releaseCup');
        }

        reqGuess(cupIndex:number) {
            this.so.emit('guess', { cupIndex});
        }


        // ********************************************************************************************************************************************
        // render
        // ********************************************************************************************************************************************

        // 放置老鼠
        putMouse(cup: Cup) {

            // guess log
            if (Role.guesser == this.currUser.role) {
                console.log('putmouse', cup);
            }
            // ani
            let height = 300;
            let mouseImg = new egret.Bitmap(this.sh.getTexture('mouse_png'));
            let posi = {
                x: cup.cupSp.x + cup.cupSp.width / 2 - mouseImg.width / 2,
                y: cup.cupSp.y + cup.cupSp.height / 2 - mouseImg.height / 2 - height
            };
            mouseImg.x = posi.x;
            mouseImg.y = posi.y;
            mouseImg.alpha = 1;
            cup.putMouse();
            this.stage.addChild(mouseImg);
            egret.Tween.get(mouseImg)
                .to({ y: posi.y + height, alpha: .3 }, 800)
                .call(() => {
                    this.stage.removeChild(mouseImg);
                    cup.showMouse();
                    if (Role.guesser == this.currUser.role) {
                        cup.fadeoutMouse();
                    }
                });




        }

        guessMouse(cupIndex: number) {
            let hand = this.hand;
            hand.toggle(true);

            let cu = _.find(this.cupList, cu => cu.index == cupIndex);
            let sp = cu.cupSp;
            hand.sp.x = sp.x + sp.width / 2;
            hand.sp.y = sp.y + sp.height / 2;
        }

        private getCupByPosi(posi: { x: number, y: number }): Cup {
            let x = posi.x;
            let y = posi.y;
            return _.find(this.cupList, (cu) => {
                let cux = cu.cupSp.x;
                let cuy = cu.cupSp.y;
                let cux2 = cux + cu.cupSp.width;
                let cuy2 = cuy + cu.cupSp.height;
                // console.log(cu.index, { x, y, cux, cuy, cux2, cuy2 });
                return cux <= x && x <= cux2 && cuy <= y && y <= cuy2 && cu.hasMouse;
            });
        }


        // 抓起杯子
        private touchCup(posi: { x: number, y: number }) {
            let cu: Cup = this.getCupByPosi(posi);
            // console.log('touchCup', posi, cu);
            if (cu) {
                let hand = this.hand;
                hand.toggle(true);

                let sp = cu.cupSp;

                hand.sp.x = sp.x + sp.width / 2;
                hand.sp.y = sp.y + sp.height / 2;

                this.currCup = cu;
                this.currCupPosi = { x: sp.x, y: sp.y };
                this.roller.status = UserStatus.rolling;

            }
        }

        // 移动杯子
        private rollCup(x: number) {
            // guess log
            
            let cupSp = this.currCup.cupSp;
            cupSp.x = x;

            // 记录roll的轨迹
            // if (Role.roller == this.currUser.role) {
            //     this.rollPath.push({ posi: { x: cupSp.x, y: cupSp.y }, ts: Date.now() });
            // }

            let hand = this.hand;
            hand.sp.x = cupSp.x + cupSp.width / 2;
            hand.sp.y = cupSp.y + cupSp.height / 2;

            _.find(this.cupList, cu => {
                if (cu == this.currCup) {
                    return false;
                }

                if (x >= cu.cupSp.x && x <= cu.cupSp.x + cu.cupSp.width) {
                    this.swapCup(cu);
                    return true;
                }
            });
        }

        // 
        private swapCup(cup: Cup) {
            egret.Tween.get(cup.cupSp)
                .to({ alpha: 0 }, .5, egret.Ease.bounceInOut)
                .call(() => {
                    let lastCupPosi = { x: cup.cupSp.x, y: cup.cupSp.y };
                    cup.cupSp.x = this.currCupPosi.x;
                    cup.cupSp.y = this.currCupPosi.y;
                    this.currCupPosi = lastCupPosi;
                })
                .to({ alpha: 1 }, .5, egret.Ease.bounceIn);

        }

        // 放开杯子
        private releaseCup() {
            if (!this.currCup) { return; }

            this.currCup.cupSp.x = this.currCupPosi.x;
            this.currCup.cupSp.y = this.currCupPosi.y;

            this.hand.toggle(false);
            this.roller.status = UserStatus.beforeRolling;



            this.hand.toggle(false);
        }


        // isWin是站在guess的角度
        addScore(isWin: boolean) {
            this.hubList.forEach(hu => {
                if (Role.guesser == hu.user.role) {
                    hu.user.scoreList.push(isWin);
                    hu.addScore(isWin);
                } else {
                    hu.user.scoreList.push(!isWin);
                    hu.addScore(!isWin);
                }
            });
        }

        private mockPutMouse() {
            this.cupList[1].putMouse();
            this.cupList[1].showMouse();
        }

        private mockScore() {
            this.addScore(true);
            this.addScore(false);
        }

        private mockHubRuntimer() {
            _.find(this.hubList, hu => {
                if (this.currUser == hu.user) {
                    hu.runTimer(5, () => {
                        console.log('5s done!!');
                    });
                    return true;
                }
            });
        }

        // ********************************************************************************************************************************************
        // createX
        // ********************************************************************************************************************************************


        private createBg() {
            let sh: egret.SpriteSheet = this.sh;
            let bg: egret.Bitmap = new egret.Bitmap(sh.getTexture('home_bg_scene_png'));
            bg.x = this.stage.stageWidth / 2 - bg.width / 2;

            this.stage.addChild(bg);
        }

        private createTip() {
            let tip = this.tip = new Tip();

            let widthRate = .6;
            let tx = tip.tx;
            tx.width = this.stage.width * widthRate;
            tx.x = this.stage.width * (1 - widthRate) / 2;
            tx.y = this.stage.height / 2 - 200;

            this.stage.addChild(tx);
        }


        private createUser(user: User) {
            let sh = this.sh;
            let face: egret.Bitmap;
            if (this.currUser == user) {
                // 使用背影
                user.isFront = false;
                user.face.y = this.stage.stageHeight - user.face.height - 140;
            } else {
                user.isFront = true;
                user.face.y = 215;
            }
            face = user.face;
            face.x = this.stage.stageWidth / 2 - user.face.width / 2;
            this.stage.addChild(face);

        }

        private createCups() {
            let cupCount = 3;
            let cupList = this.cupList;
            for (let i = 0; i < cupCount; i++) {
                let cu = new Cup(i);
                let sp = cu.cupSp;
                let margin = (this.stage.stageWidth - cupCount * sp.width) / (cupCount + 1);
                sp.x = margin + (sp.width + margin) * i;
                sp.y = this.stage.height / 2 - 120;
                this.stage.addChild(sp);

                cu.setShadowOpacity((cupCount - i) / cupCount);

                cupList.push(cu);
            }
        }

        private createHubs() {
            let userList = this.userList;
            let hu: Hub;
            for (let us of userList) {
                if (us == this.currUser) {
                    hu = new Hub(us, HubPosition.bottom);
                    hu.sp.y = this.stage.stageHeight - hu.sp.height;
                } else {
                    hu = new Hub(us, HubPosition.top);
                    hu.sp.y = 0;
                }
                hu.sp.x = this.stage.stageWidth / 2 - hu.sp.width / 2;

                this.stage.addChild(hu.sp);
                this.hubList.push(hu);
            }
        }


        private createHand() {
            let hand = this.hand = new Hand();
            hand.sp.x = 500;
            hand.sp.y = 600;
            this.stage.addChild(hand.sp);



        }






    }
}
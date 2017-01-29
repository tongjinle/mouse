/// <reference path="../libs/underscore/underscore.d.ts" />

namespace Client {
    export class Game {

        currUser: User;
        userList: User[];
        cupList: Cup[];
        hubList: Hub[];
        hand: Hand;
        tip: Tip;

        isCorrect :boolean;

        
        scoreList:number[];


        private _mouseImg : egret.Bitmap;
        public get mouseImg() : egret.Bitmap {
            if(!this._mouseImg){
                this._mouseImg = new egret.Bitmap(this.sh.getTexture('mouse_png'));
                this._mouseImg.touchEnabled = true;
                this.stage.addChild(this._mouseImg);
            }
            
            return this._mouseImg;
        }
       

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
            // beforeShowMouse
            // ********************************************************************************************************************************************
            // dict[GameStatus.beforeShowMouse] = ()=>{
            //     this.showMouse(()=>{
            //         this.status = GameStatus.beforeHoldMouse;
            //     });
            // };

            // ********************************************************************************************************************************************
            // beforeHoldMouse
            // ********************************************************************************************************************************************
            // dict[GameStatus.beforeHoldMouse] = ()=>{

            // };

            // ********************************************************************************************************************************************
            // beforePutMouse
            // ********************************************************************************************************************************************
       
            dict[GameStatus.beforePutMouse] = () => {
                this.roller.status = UserStatus.beforePutMouse;
                this.guesser.status = UserStatus.beforeWatching;

                this.showMouse(()=>{});

                if (this.currUser.role == Role.roller) {
                    // show tips
                    // this.tip.showMsg(CONFIG.PUT_MOUSE_TIP, CONFIG.PUT_MOUSE_TIP_DURATION, () => { });
                   
                    // 超时没有放置mouse,就会随机在一个cup中放置mouse
                    // mock

                    this.currHub.runTimer(CONFIG.PUT_MOUSE_DURATION, () => {
                        if(GameStatus.beforePutMouse!=this.status){
                            return;
                        }
                        if (UserStatus.beforePutMouse == this.roller.status) {
                            let cupIndex = Math.floor(Math.random() * this.cupList.length);
                            // test 
                            // if(this.currUser.animal==Animal.cat){
                            //     cupIndex=0;
                            // }else{
                            //     cupIndex=2;
                            // }
                            
                            let cu = this.cupList[cupIndex];
                            let x = cu.cupSp.x+cu.cupSp.width/2-this.mouseImg.width/2;
                            let y = cu.cupSp.y+cu.cupSp.height/2-this.mouseImg.height/2;

                            this.hand.toggle(true);
                            egret.Tween.get(this.mouseImg,{onChange:()=>{
                                this.hand.sp.x = this.mouseImg.x + this.mouseImg.width/2;
                                this.hand.sp.y = this.mouseImg.y + this.mouseImg.height/2;
                            },onChangeObj:this})
                                .to({x,y},800)
                                .call(()=>{
                                    this.reqPutMouse(this.cupList[cupIndex].index);

                                });
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

                // 提示
                if (this.roller == this.currUser) {
                    this.tip.showMsg(CONFIG.ROLL_TIP, CONFIG.ROLL_TIP_DURATION, () => { });
                    this.tip.sp.x = this.currCup.cupSp.x + this.currCup.cupSp.width/2;
                    this.tip.sp.y = this.currCup.cupSp.y - this.tip.sp.height;
                }

                // hand的显示
                this.hand.sp.visible = Role.roller == this.currUser.role;
                

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


                 if(Role.guesser == this.currUser.role){
                    this.tip.showMsg(CONFIG.GUESS_MOUSE_TIP,CONFIG.GUESS_MOUSE_TIP_DURATION,()=>{});
                    this.tip.sp.x = this.stage.stageWidth/2;
                    this.tip.sp.y = 720; 
                 }

            };

            // ********************************************************************************************************************************************
            // afterGuess
            // ********************************************************************************************************************************************
            dict[GameStatus.afterGuess] =()=>{
                console.log('afterGuess');
                
                // 计算currUser的猜测结果
                let isCorrect  = this.isCorrect;
                
                this.roller.isRoundWin = !isCorrect;
                this.guesser.isRoundWin = isCorrect;

                this.roller.status = UserStatus.afterGuess;    
                this.guesser.status = UserStatus.afterGuess;
                

                this.userList.forEach((us, i, list) => {
                    if ((us == this.roller && this.roller.isRoundWin)||(us == this.guesser && this.guesser.isRoundWin)) {
                        this.scoreList[i]++;
                    }
                    
                });

                // 判断是不是已经结束
                if (!!_.find(this.scoreList, (so) => { return so == (CONFIG.maxCount + 1) / 2; })) {
                    return;
                }
               

                setTimeout(()=>{
                    
                    this.status = GameStatus.roundEnd;
                },CONFIG.REST_DURATION);
            };

            let reRoundHandler;
            dict[GameStatus.roundEnd]=()=>{
                console.log('round end');
               
                // cupList
                this.resetCup();

                // mouseImg
                this.mouseImg.alpha=0;

                // curr...
                this.currCup = undefined;
                this.currCupPosi = undefined;
                this.currGuessCupIndex = undefined;


                // face
                this.userList.forEach(us=>{
                    us.role = Role.guesser == us.role? Role.roller : Role.guesser;
                    us.resetRole(us.role);
                });

                let reRoundHandler = setTimeout(()=>{
                    this.status = GameStatus.beforePutMouse;
                    reRoundHandler = undefined;
                },500);

            };

            dict[GameStatus.gameEnd] =()=>{
                if(reRoundHandler){
                    clearTimeout(reRoundHandler);
                }
            };



            dict[v] && dict[v]();
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

        private currCup: Cup;
        private currAniCup:Cup;
        private currCupPosi: { x: number, y: number };
        private currGuessCupIndex:number;

        private stage: egret.Stage;
        private sh: egret.SpriteSheet;

        private binder:Binder;

        constructor(stage: egret.Stage, userList: User[], currUserId) {
            this.stage = stage;
            this.sh = RES.getRes('basic_png');

            this.userList = userList;
            
            // 初始化比分
            this.scoreList = [];
            this.userList.forEach(()=>{
                this.scoreList.push(0);
            });

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


            // holdMouse
            // 点击抓住老鼠
            binder.watch({
                beWatched:this.mouseImg,
                eventname:egret.TouchEvent.TOUCH_BEGIN,
                handler:(e:egret.TouchEvent)=>{

                    this.reqNotify('holdMouse',undefined);
                    this.tip.hide();

                    // this.status = GameStatus.beforePutMouse;
                },
                context:null,
                onStatus:GameStatus[GameStatus.beforePutMouse],
                offStatus:Binder.OTHER_STATUS
            });

            // afterHoldMouse
            // 抓住老鼠之后,移动老鼠
            binder.watch({
                beWatched:this.stage,
                eventname:egret.TouchEvent.TOUCH_MOVE,
                handler:(e:egret.TouchEvent)=>{
                    this.reqNotify('moveHoldMouse',{x:e.stageX,y:e.stageY});

                    // 如果撞到杯子,则把老鼠丢进去
                    let cu = this.getCupByPosi({ x: e.stageX, y: e.stageY });
                    let currAniCup = this.currAniCup;
                    if (cu) {
                        console.log('cu:',cu);
                        this.reqPutMouse(cu.index);
                                            
                    }
                },
                context:null,
                onStatus:GameStatus[GameStatus.beforePutMouse],
                offStatus:Binder.OTHER_STATUS
            });

            // binder.watch({
            //     beWatched:this.stage,
            //     eventname:egret.TouchEvent.TOUCH_END,
            //     handler: (e: egret.TouchEvent) => {
            //         let cu = this.getCupByPosi({ x: e.stageX, y: e.stageY });
            //         let currAniCup = this.currAniCup;
            //         if (cu) {
            //             console.log('cu:',cu);
            //             this.reqPutMouse(cu.index);
            //             // this.status = GameStatus.beforeRolling

            //             // this.openCup(cu,()=>{
            //             //         // this.mouseImg.visible=false;
            //             // });                       
            //         }
            //     },
            //     context:null,
            //     onStatus:GameStatus[GameStatus.beforePutMouse],
            //     offStatus:Binder.OTHER_STATUS
            // });
            
            this.cupList.forEach((cu, i) => {
                let sp = cu.cupSp;
                sp.touchEnabled = true;

                // putMouse
                // binder.watch({
                //     beWatched: sp,
                //     eventname: egret.TouchEvent.TOUCH_BEGIN,
                //     handler: (e: egret.TouchEvent) => {
                //         if (this.currUser != this.roller || UserStatus.beforePutMouse != this.roller.status) {
                //             return;
                //         }
                //         this.reqPutMouse(cu.index);
                //         // this.status = GameStatus.beforeRolling
                //     },
                //     context: this,
                //     onStatus: GameStatus[GameStatus.beforePutMouse],
                //     offStatus: Binder.OTHER_STATUS
                // });

                // guessMouse
                binder.watch({
                    beWatched:sp,
                    eventname:egret.TouchEvent.TOUCH_BEGIN,
                    handler:(e:egret.TouchEvent)=>{
                        if (Role.guesser != this.currUser.role) {
                            return;
                        }
                        if(this.currGuessCupIndex!==undefined){
                            return;
                        }
                        this.currGuessCupIndex = cu.index;
                        this.reqGuess(cu.index);
                        // this.status = GameStatus.afterGuess;
                    },
                    context:this,
                    onStatus:GameStatus[GameStatus.afterRolling],
                    offStatus:Binder.OTHER_STATUS
                });

            });


            // 点击某个杯子,显示出HALO
            // 开始roll
            binder.watch({
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

            // 绑定notify
            so.on('onnotify',(data:{type:string,data:any})=>{
                let type = data.type;
                let notifyData = data.data;
                if('holdMouse'==type){
                    this.holdMouse();
                }else if('moveHoldMouse'==type){
                    let {x,y} = notifyData as {x:number,y:number};
                    this.moveMouse(x,y);
                }
            });

            // 绑定putmouse
            so.on('onputMouse', (data: { flag: boolean, cupIndex: number }) => {
                let {flag, cupIndex} = data;
                if (flag) {
                    console.log(this.cupList[cupIndex].index,cupIndex);
                    this.putMouse(this.cupList[cupIndex],()=>{
                        this.status = GameStatus.beforeRolling;
                        
                    });
                    this.currHub.clearTimer();

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
                let {cupIndex,isCorrect} = data;
                this.isCorrect = isCorrect;
                this.guessMouse(cupIndex, isCorrect, () => {
                    this.status = GameStatus.afterGuess;
                });
            });


            so.on('onpublishScore', (data: { userIdList: string[], result: number[] }) => {
                let {userIdList, result} = data;
                // host is first roller
                let isHost = userIdList[0] == this.currUser.userId;
                let realRst = result.map((re, i) => ((i % 2) == (isHost ? 0 : 1)) ? (re + 1) % 2 : re);
                console.log('realRst:', this.currUser.username, realRst);
                let isWin = realRst.filter(re => re == 1).length >= 2;


                this.showRst(isWin);

                this.status = GameStatus.gameEnd;
            });

            so.on('onround',(data)=>{

            });
        }



        start() {
            // this.status = GameStatus.beforeShowMouse;
            this.status = GameStatus.beforePutMouse;
            // this.showRst(true);
            // this.playAudio('bgm_mp3','bgm');
        }

        playAudio(name:string,type:string){
            let sound:egret.Sound = RES.getRes('bgm_mp3');
             // new egret.Sound();
            // sound.load('resource/assets/bgm.mp3');
            // sound.load(RES.getRes(name));
            sound.play();
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

        reqNotify(type:string,data:any){
            console.log('notify:',type,data);
            this.so.emit('notify',{type,data});
        }


        // ********************************************************************************************************************************************
        // render
        // ********************************************************************************************************************************************

        // 显示等待抓起的老鼠
        // 老鼠要说,请把我藏起来(guess不用显示文字)
        showMouse(next:()=>void) {
            let mo = this.mouseImg;
            mo.alpha=1;    
            mo.visible = true;
            mo.x = this.stage.stageWidth /2 - mo.width/2;
            mo.y = this.stage.stageHeight -550;
            if (Role.roller == this.currUser.role) {
                let tip = this.tip;
                let sp = tip.sp;
                sp.x = mo.x + mo.width/2;
                sp.y = mo.y-mo.height-30;
                tip.showMsg(CONFIG.SHOW_MOUSE_TIP, CONFIG.SHOW_MOUSE_TIP_DURATION, next);

            }
        }
        

        // 抓起老鼠(或者叫握住老鼠)
        holdMouse(){
            let mo = this.mouseImg;
            console.log('hold mouse');
            let hand = this.hand;
            hand.toggle(true);
            hand.sp.x = this.mouseImg.x + mo.width/2;
            hand.sp.y = this.mouseImg.y + mo.height/2;
        }

        // 移动抓起的老鼠,遇到杯子,杯子抬起来的动画
        // 已经抬起来的杯子,应该立刻放下
        moveMouse(x:number,y:number){
            let hand = this.hand;
            hand.sp.x = x;
            hand.sp.y = y;

            let mo = this.mouseImg;
            mo.x = hand.sp.x -mo.width/2;
            mo.y = hand.sp.y -mo.height/2;
        }

        // 打开杯子
        openAni:AniMgr;
        openCup(cup:Cup,next:()=>void){
            this.currCup = cup;
            console.group('openCup');
            console.log(cup.index);
            console.groupEnd();
            let frames:egret.Texture[] = [];
            let sh:egret.SpriteSheet = RES.getRes("cupAni_png");
            for(let i=1;i<=10;i++){
                let te = `open_${i<10?'0'+i:i}_png`;
                frames.push(sh.getTexture(te));
            }
            frames = frames.concat(frames.slice(0).reverse());
            let delay = CONFIG.OPEN_CUP_SPEED;
            if(!this.openAni){
                this.openAni = new AniMgr(frames,delay,()=>{
                    ani.img.visible = false;
                    this.currCup.cupSp.visible = true;
                    next();
                });
                this.stage.addChild(this.openAni.img);
            }

            let ani = this.openAni;
            ani.img.visible = true;
            cup.cupSp.visible = false;
            ani.img.x = cup.cupSp.x + cup.cupSp.width/2 - ani.img.width/2;
            ani.img.y = cup.cupSp.y+cup.cupSp.height-ani.img.height;

            ani.start();
        }

        // 关闭杯子
        unOpenCup(cup:Cup,next:()=>void){
            let frames:egret.Texture[] = [];
            let sh:egret.SpriteSheet = RES.getRes("cupAni_png");
            for(let i=1;i<=10;i++){
                frames.push(sh.getTexture(`open_${i<10?'0'+i:i}_png`));
            }
            frames = frames.reverse();
            let delay =  CONFIG.OPEN_CUP_SPEED;
            let ani = new AniMgr(frames,delay,()=>{
                ani.img.visible = false;
                cup.cupSp.visible = true;
                next();
            });

            this.stage.addChild(ani.img);
            ani.img.x = cup.cupSp.x;
            ani.img.y = cup.cupSp .y;

            ani.start();
        }


        // 放置老鼠
        putMouse(cup: Cup,next:()=>void) {
            this.currCup =cup;
            console.log(cup.index);
            this.openCup(cup, () => {
                let cup = this.currCup;
                this.mouseImg.alpha = 0;
                cup.putMouse();
                console.group('putMouse');
                console.log(cup.index);
                console.groupEnd();    
                cup.showMouse();
                if (Role.guesser == this.currUser.role) {
                    cup.fadeoutMouse();
                }
                next();
            });

            if(1){return;}

            // guess log
            if (Role.guesser == this.currUser.role) {
                console.log('putmouse', cup);
            }
            // ani
            let height = 300;
            let mouseImg = this.mouseImg;
            let posi = {
                x: cup.cupSp.x + cup.cupSp.width / 2 - mouseImg.width / 2,
                y: cup.cupSp.y + cup.cupSp.height / 2 - mouseImg.height / 2 - height
            };
            mouseImg.x = posi.x;
            mouseImg.y = posi.y;
            mouseImg.alpha = 1;
            cup.putMouse();
            egret.Tween.get(mouseImg)
                .to({ y: posi.y + height, alpha: .3 }, 800)
                .call(() => {
                    this.mouseImg.alpha = 0;
                    cup.showMouse();
                    if (Role.guesser == this.currUser.role) {
                        cup.fadeoutMouse();
                    }
                });




        }

        // 猜老鼠在哪个cup
        guessMouse(cupIndex: number,isCorrect:boolean,next:()=>void) {
            let hand = this.hand;
            hand.toggle(false);

            let cu = _.find(this.cupList, cu => cu.index == cupIndex);
            let sp = cu.cupSp;
            let center = {
                x: sp.x + sp.width/2,
                y:sp.y+sp.height/2
            };
            hand.sp.x = sp.x + sp.width / 2;
            hand.sp.y = sp.y + sp.height / 2;

            egret.Tween.get(sp)
            .to({y:sp.y-200,alpha:0},400)
            .call(()=>{
                hand.toggle(false);
            })
            .call(()=>{
                if(isCorrect){
                    let mouseImg = this.mouseImg;
                    mouseImg.x = center.x-mouseImg.width/2;
                    mouseImg.y = center.y - mouseImg.height/2;
                    mouseImg.alpha = 0.1;
                    mouseImg.scaleX = mouseImg.scaleY = .3;

                    egret.Tween.get(mouseImg)
                    .to({alpha:1,scaleX:1,scaleY:1},600,egret.Ease.backInOut)
                    .call(()=>this.addScore(isCorrect,next));
                }else{
                    this.addScore(isCorrect,next);
                }
            });
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
                return cux <= x && x <= cux2 && cuy <= y && y <= cuy2;
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
        addScore(isWin: boolean,next?:()=>void) {
            this.hubList.forEach(hu => {
                if (Role.guesser == hu.user.role) {
                    hu.user.scoreList.push(isWin);
                    hu.addScore(isWin);
                } else {
                    hu.user.scoreList.push(!isWin);
                    hu.addScore(!isWin);
                }
            });

            next && next();
        }

        showRst(isWin:boolean){
            console.log('showRst',isWin);
            // mask
            let ma = new egret.Shape();
            ma.graphics.beginFill(0x000000,.8);
            ma.graphics.drawRect(0,0,this.stage.stageWidth,this.stage.stageHeight);
            ma.graphics.endFill();
            this.stage.addChild(ma);

            // scoreBoard
            let sb = new ScoreBoard(this.currUser.animal,isWin);
            sb.sp.x = this.stage.stageWidth/2 - sb.sp.width/2;
            sb.sp.y=200;
            this.stage.addChild(sb.sp);
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
            let tipSp = tip.sp;
            tipSp.width = this.stage.width * widthRate;
            tipSp.x = this.stage.width * (1 - widthRate) / 2;
            tipSp.y = this.stage.height / 2 - 200;

            this.stage.addChild(tipSp);
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

        private resetCup(){
            let cupList = this.cupList;
            let cupCount = cupList.length;
            for (let i = 0; i <  cupCount; i++) {
                let cu = cupList[i];
                let sp = cu.cupSp;
                let margin = (this.stage.stageWidth - cupCount * sp.width) / (cupCount + 1);
                sp.x = margin + (sp.width + margin) * i;
                sp.y = this.stage.height / 2 - 120;
                sp.alpha = 1;
                // cu.setShadowOpacity((cupCount - i) / cupCount);
                cu.fadeoutMouse();
            }
        }

        private createCups() {
            let cupCount = 3;
            let cupList = this.cupList;
            for (let i = 0; i < cupCount; i++) {
                let cu = new Cup(i);
                let sp = cu.cupSp;
                this.stage.addChild(sp);
                cupList.push(cu);
            }
            this.resetCup();
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
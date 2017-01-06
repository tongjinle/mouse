/// <reference path="../libs/underscore/underscore.d.ts" />

namespace Client {
    export class Game {
        currUser: User;
        userList: User[];
        cupList: Cup[];
        hubList: Hub[];
        hand: Hand;
        tip: Tip;


        private _status : GameStatus;
        public get status() : GameStatus {
            return this._status;
        }
        public set status(v : GameStatus) {
            this._status = v;

            let  dict:{[stat:number]:()=>void} ={};
            dict[GameStatus.beforePutMouse] = ()=>{
                if (this.currUser.role == Role.roller) {
                this.startPutMouseTimer();
            }
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
        constructor(stage: egret.Stage) {
            this.stage = stage;
            this.sh = RES.getRes('basic_png');

            this.userList = [];
            this.cupList = [];
            this.hubList = [];


        }

        createStage() {
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

        start() {
            this.status = GameStatus.beforePutMouse;
        }



        private startPutMouseTimer() {
            this.roller.status = UserStatus.beforePutMouse;
            this.guesser.status = UserStatus.watching;

            // show tips

            this.tip.showMsg(CONFIG.PUT_MOUSE_TIP, CONFIG.PUT_MOUSE_TIP_DURATION, () => {

            });
            this.cupList.forEach(cu => {
                let sp = cu.cupSp;
                sp.touchEnabled = true;
                sp.addEventListener(egret.TouchEvent.TOUCH_BEGIN, (e: egret.TouchEvent) => {
                    if (this.currUser != this.roller || UserStatus.beforePutMouse != this.roller.status) {
                        return;
                    }
                    this.putMouse(cu);
                    this.currHub.clearTimer();
                }, this);
            });
            this.currHub.runTimer(CONFIG.PUT_MOUSE_DURATION, () => {
                if (UserStatus.beforePutMouse == this.roller.status) {

                    let cu = this.cupList[Math.floor(Math.random() * this.cupList.length)];
                    this.putMouse(cu);
                }
            });
        }

        private putMouse(cup: Cup) {
            // ani
            let height = 300
            let mouseImg = new egret.Bitmap(this.sh.getTexture('mouse_png'));
            let posi = {
                x: cup.cupSp.x + cup.cupSp.width / 2 - mouseImg.width / 2,
                y: cup.cupSp.y + cup.cupSp.height / 2 - mouseImg.height / 2 - height
            };
            mouseImg.x = posi.x;
            mouseImg.y = posi.y;
            mouseImg.alpha = 1;
            this.stage.addChild(mouseImg);
            egret.Tween.get(mouseImg)
                .to({ y: posi.y + height, alpha: .3 }, 800)
                .call(() => {
                    this.stage.removeChild(mouseImg);
                    cup.putMouse();
                    cup.showMouse();
                    this.roller.status = UserStatus.beforeRolling;


                    this.startRollTimer();
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


            // 点击某个杯子,显示出HALO
            // 开始roll
            this.stage.addEventListener(egret.TouchEvent.TOUCH_BEGIN, (e: egret.TouchEvent) => {
                if (this.currUser != this.roller) {
                    return;
                }

                if (this.roller.status != UserStatus.beforeRolling) {
                    return;
                }

                let x = e.stageX;
                let y = e.stageY;

                hand.toggle(false);
                // 探测hand是否碰到了cup
                _.find(this.cupList, (cu) => {
                    let cux = cu.cupSp.x;
                    let cuy = cu.cupSp.y;
                    let cux2 = cux + cu.cupSp.width;
                    let cuy2 = cuy + cu.cupSp.height;



                    if (cux <= x && x <= cux2 && cuy <= y && y <= cuy2 && cu.hasMouse) {
                        hand.toggle(true);
                        hand.sp.x = cux + cu.cupSp.width / 2;
                        hand.sp.y = cuy + cu.cupSp.height / 2;

                        this.currCup = cu;
                        this.currCupPosi = { x: cux, y: cuy };
                        this.roller.status = UserStatus.rolling;
                    }
                });
            }, this);

            // 点击某个cup,进入ROLLING状态
            this.stage.addEventListener(egret.TouchEvent.TOUCH_MOVE, (e: egret.TouchEvent) => {
                if (this.currUser != this.roller) {
                    return;
                }

                if (this.roller.status != UserStatus.rolling) {
                    return;
                }

                // this.currCup = _.find(this.cupList,cu=>cu.hasMouse);

                let cupSp = this.currCup.cupSp;
                cupSp.x = e.stageX;
                hand.sp.x = cupSp.x + cupSp.width / 2;
                hand.sp.y = cupSp.y + cupSp.height / 2;

                _.find(this.cupList, cu => {
                    if (cu == this.currCup) {
                        return false;
                    }

                    let rect: egret.Rectangle = new egret.Rectangle(cu.cupSp.x, cu.cupSp.y, cu.cupSp.width, cu.cupSp.height);
                    let point: egret.Point = new egret.Point(e.stageX, e.stageY);
                    if (e.stageX >= cu.cupSp.x && e.stageX <= cu.cupSp.x + cu.cupSp.width) {
                        this.swapCup(cu);
                        return true;
                    }
                });


            }, this);

            // roll结束
            this.stage.addEventListener(egret.TouchEvent.TOUCH_END, (e: egret.TouchEvent) => {
                if (this.roller.status != UserStatus.rolling) {
                    return;
                }

                this.endRoll();
            }, this);

        }

        private startRollTimer() {
            this.currHub.runTimer(CONFIG.ROLL_DURATION, () => {
                this.endRoll();
                this.hand.toggle(false);
                this.roller.status = UserStatus.afterRoll;

                this.guesser.status = UserStatus.afterWatching; 
            });
        }

        private endRoll() {
            if (!this.currCup) {
                return;
            }
            this.currCup.cupSp.x = this.currCupPosi.x;
            this.currCup.cupSp.y = this.currCupPosi.y;

            this.hand.toggle(false);
            this.roller.status = UserStatus.beforeRolling;
        }

        private swapCup(cup: Cup) {
            egret.Tween.get(cup.cupSp).to({ alpha: 0 }, .5, egret.Ease.bounceInOut)
                .call(() => {
                    let lastCupPosi = { x: cup.cupSp.x, y: cup.cupSp.y };
                    cup.cupSp.x = this.currCupPosi.x;
                    cup.cupSp.y = this.currCupPosi.y;
                    this.currCupPosi = lastCupPosi;
                    console.log(this.currCupPosi);
                })
                .to({ alpha: 1 }, .5, egret.Ease.bounceIn);
        }

        private isInRect(rect: egret.Rectangle, point: egret.Point): boolean {
            return point.x >= rect.x &&
                point.x <= rect.x + rect.width &&
                point.y >= rect.y &&
                point.y <= rect.y + rect.width;

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

        guess(cup: Cup) {
            if (this.currUser != this.guesser) {
                return;
            }

            if (this.guesser.status != UserStatus.afterWatching) {

            }
        }



    }
}
namespace Client {
    export class User {
        userId: string;
        username: string;
        logoUrl: string;
        scoreList: boolean[];
        role: Role;
        animal: Animal;
        // status:UserStatus;

        // 记录本回合是不是胜利
        isRoundWin: boolean = false;

        private _status: UserStatus;
        public get status(): UserStatus {
            return this._status;
        }
        public set status(v: UserStatus) {
            let lastStatus = this._status;
            this._status = v;
            //

            if (!this.isFront) {
                return;
            }
            if (lastStatus == this._status) {
                return;
            }

          
            let sh: egret.SpriteSheet;
            if (this.animal == Animal.cat) {
                sh = RES.getRes('cat_png');

            } else {
                sh = RES.getRes('dog_png');
            }
            if (v == UserStatus.watching) {
                let count = 8;
                let list = [];
                let delay =300;
                for (var i = 0; i < count; i++) {
                    let te = sh.getTexture(`0${i + 1}_png`);
                    console.log(te,`0${i + 1}_png`);
                    list.push(te);
                }
                this.runFaceAni(list,delay);
              
            } else if (v == UserStatus.afterWatching) {
                this.stopFaceAni();
            } else if (v == UserStatus.afterGuess) {
                let aniPre = this.animal == Animal.dog ? 'd' : 'c';
                let winPre = this.isRoundWin ? 'r' : 'w';
                let delay = 200;
                console.log(Animal[this.animal], this.isRoundWin,winPre);
                let list = [
                    sh.getTexture(`${aniPre}_${winPre}_01_png`),
                    sh.getTexture(`${aniPre}_${winPre}_02_png`)
                ];
                this.runFaceAni(list,delay);
            }

        }

        private frontFace: egret.Bitmap;
        private backFace: egret.Bitmap;
        private faceAniTimer: egret.Timer;

        private runFaceAni(textureList: egret.Texture[], delay: number) {
            if(this.faceAniTimer && this.faceAniTimer.running){
                this.faceAniTimer.stop();
                this.faceAniTimer = null;
            }
            let ti = this.faceAniTimer =  new egret.Timer(delay, 0);
            let index = 0;
            let len = textureList.length;
            ti.addEventListener(egret.TimerEvent.TIMER,()=>{
                console.log('timer...');
                this.face.texture = textureList[index];
                index = (index+1)%len;
            },null);

            ti.start();

        }

        private stopFaceAni(){
            this.faceAniTimer && this.faceAniTimer.stop();
        }

        isFront: boolean;

        public get face(): egret.Bitmap {
            return this.isFront ? this.frontFace : this.backFace;
        }



        private shCat: egret.SpriteSheet;
        private shDog: egret.SpriteSheet;

        constructor(userId: string, username: string, animal: Animal, role?: Role) {
            this.shCat = RES.getRes('cat_png');
            this.shDog = RES.getRes('dog_png');


            this.userId = userId;
            this.username = username;
            this.animal = animal;
            this.scoreList = [];
            if (role !== undefined) {
                this.resetRole(role);

                this.createFace();
            }


        }

        /**
        * 重置角色
        * 同时初始化角色所对应的状态    
        */
        resetRole(role: Role) {
            this.role = role;
            if (Role.guesser == this.role) {
                this.status = UserStatus.beforePutMouse;
            } else if (Role.roller == this.role) {
                this.status = UserStatus.beforeWatching;
            }
        }

        private createFace() {
            let sh: egret.SpriteSheet;
            let an: string;
            if (this.animal == Animal.cat) {
                sh = this.shCat;
                an = 'cat';
            } else if (this.animal == Animal.dog) {
                sh = this.shDog;
                an = 'dog';
            }

            this.frontFace = new egret.Bitmap(sh.getTexture(`${an}_front_png`));
            this.backFace = new egret.Bitmap(sh.getTexture(`${an}_back_png`));
        }



    }
}
namespace Client {
    export class User {
        userId: string;
        username: string;
        logoUrl: string;
        scoreList: boolean[];
        role: Role;
        animal: Animal;
        // status:UserStatus;

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

            let count = 8;
            let index = 1;
            let sh: egret.SpriteSheet;

            let ti = this.faceAniTimer = new egret.Timer(300, 0);
            ti.addEventListener(egret.TimerEvent.TIMER, () => {
                this.frontFace.texture = sh.getTexture(`0${index+1}_png`);
                index = (index+1)%count
            }, this);

            if (this.animal == Animal.cat) {
                sh = RES.getRes('cat_png');

            } else {
                sh = RES.getRes('dog_png');
            }
            if (v == UserStatus.watching) {
                ti.reset();
                ti.start();
            }

        }

        private frontFace: egret.Bitmap;
        private backFace: egret.Bitmap;
        private faceAniTimer: egret.Timer;

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
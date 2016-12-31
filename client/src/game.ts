namespace Client {
    export class Game {
        currUser: User;
        userList: User[];

        private stage: egret.DisplayObjectContainer;
        private sh: egret.SpriteSheet;
        constructor(stage: egret.DisplayObjectContainer) {
            this.stage = stage;
            this.sh = RES.getRes('basic_png');

            this.userList = [];

            this.createStage();
        }

        createStage() {
            this.createBg();
            for (let user of this.userList) {
                this.createUser(user);

            }
        }

        private createBg() {
            let sh: egret.SpriteSheet = this.sh;
            let bg: egret.Bitmap = new egret.Bitmap(sh.getTexture('home_bg_scene_png'));
            this.stage.addChild(bg);
        }


        private createUser(user: User) {
            let sh = this.sh;
            let face: egret.Bitmap;
            if (this.currUser == user) {
                // 使用背影
                face = user.backFace;
                face.x = 300;
                face.y = this.stage.height - face.height - 140;
                this.stage.addChildAt(face, 2);
            } else {
                face = user.face;
                face.x = 300;
                face.y = 215;
            }

            face.x = this.stage.width / 2 - face.height / 2;
            this.stage.addChildAt(face, 2);
        }
    }
}
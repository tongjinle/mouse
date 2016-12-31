namespace Client {
    export class Game {
        currUser: User;
        userList: User[];
        cupList: Cup[];

        private stage: egret.Stage;
        private sh: egret.SpriteSheet;
        constructor(stage: egret.Stage) {
            this.stage = stage;
            this.sh = RES.getRes('basic_png');

            this.userList = [];
            this.cupList = [];

            
        }

        createStage() {
            this.createBg();
            for (let user of this.userList) {
                this.createUser(user);

            }
            this.createCups();

            this.mockPutMouse();
            console.trace('***');
        }

        private mockPutMouse(){
            this.cupList[1].putMouse();
            this.cupList[1].showMouse();
        }

        private createBg() {
            let sh: egret.SpriteSheet = this.sh;
            let bg: egret.Bitmap = new egret.Bitmap(sh.getTexture('home_bg_scene_png'));
            bg.x = this.stage.stageWidth / 2 - bg.width / 2;

            this.stage.addChild(bg);
        }


        private createUser(user: User) {
            let sh = this.sh;
            let face: egret.Bitmap;
            if (this.currUser == user) {
                // 使用背影
                face = user.backFace;
                face.y = this.stage.stageHeight - face.height - 140;
                this.stage.addChild(face);
            } else {
                face = user.face;
                face.y = 215;
            }
            face.x = this.stage.stageWidth / 2 - face.width / 2;
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

                cu.setShadowOpacity((cupCount-i)/cupCount);

                cupList.push(cu);
            }
        }

    }
}
/// <reference path="../libs/underscore/underscore.d.ts" />

namespace Client {
    export class Game {
        currUser: User;
        userList: User[];
        cupList: Cup[];
        hubList: Hub[];

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
            this.mockPutMouse();

            this.createHubs();
            // mock
            this.mockScore();
            this.mockHubRuntimer();

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


    }
}
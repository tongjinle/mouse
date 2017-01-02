namespace Client {
    export class Hub {
        static HUB_COUNT = 3;

        sp: egret.Sprite;
        private bgImg: egret.Bitmap;
        private scoreImgList: egret.Bitmap[];
        // 决定了要插入的位置
        private index: number;
        // hub的上下位置
        private posi: HubPosition;
        // 玩家
        user: User;

        private sh: egret.SpriteSheet;

        constructor(user: User, posi: HubPosition) {
            this.sh = RES.getRes('basic_png');

            this.user = user;
            this.index = 0;
            this.posi = posi;
            this.sp = new egret.Sprite();
            this.scoreImgList = [];

            this.createBg();
            this.createLogo();
        }

        private createBg() {
            let bgImgName: string;
            let scoreImgName: string;
            if (HubPosition.top == this.posi) {
                bgImgName = 'enemy_score_bg_png';
                scoreImgName = 'enemy_score_empty_png';
            } else {
                bgImgName = 'my_score_bg_png';
                scoreImgName = 'my_score_empty_png';

            }
            this.bgImg = new egret.Bitmap(this.sh.getTexture(bgImgName));
            this.sp.addChild(this.bgImg);

            for (var i = 0; i < Hub.HUB_COUNT; i++) {
                let sc = new egret.Bitmap(this.sh.getTexture(scoreImgName));
                let startMargin = 180;
                let margin = (this.sp.width - 2 * startMargin - Hub.HUB_COUNT * sc.width) / (Hub.HUB_COUNT + 1);
                sc.x = startMargin + margin + (margin + sc.width) * i;
                sc.y = this.sp.height / 2 - sc.height / 2 + (this.posi == HubPosition.top ? -1 : 1) * 14;
                this.sp.addChild(sc);
                this.scoreImgList.push(sc);
            }
        }

        private createLogo() {
            let loader = RES.getResByUrl(this.user.logoUrl, te => {
                let img = new egret.Bitmap(te);
                img.x = 20;
                img.y = this.posi == HubPosition.top ? 15 : 55;
                img.width = 100;
                img.height = 100;

                this.sp.addChild(img);
            }, this, RES.ResourceItem.TYPE_IMAGE);
        }

        addScore(isWin: boolean) {
            let scoreImgName: string;
            if (HubPosition.top == this.posi) {
                scoreImgName = isWin ? 'enemy_score_right_png' : 'enemy_score_wrong_png';
            } else {
                scoreImgName = isWin ? 'my_score_right_png' : 'my_score_wrong_png';
            }
            this.scoreImgList[this.index].texture = this.sh.getTexture(scoreImgName);
            this.index++;
        }
    }
}
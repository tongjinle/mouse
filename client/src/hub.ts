namespace Client {
    export class Hub {
        static HUB_COUNT = 3;

        sp: egret.Sprite;
        private bgImg: egret.Bitmap;
        private scoreImgList: egret.Bitmap[];
        // 倒计时
        private timer: egret.TextField;
        private timerListener: Function;
        // 决定了要插入的位置
        private index: number;
        // hub的上下位置
        private posi: HubPosition;
        // 定时器
        private ti: egret.Timer;
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
            this.createOther();
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


        private createOther() {
            if (HubPosition.top == this.posi) {
                let img = new egret.Bitmap(this.sh.getTexture('menu_icon_png'));
                img.x = this.sp.width - 20 - img.width;
                img.y = 15;
                this.sp.addChild(img);
                img.touchEnabled = true;
                img.addEventListener(egret.TouchEvent.TOUCH_END, () => {
                    console.log('touch menu_icon');
                }, img);
            } else {
                let tx = new egret.TextField();
                // tx.fontFamily = RES.getRes('nums');
                tx.text = '10';
                tx.x = this.sp.width - 150;
                tx.y = 40;
                tx.width = 145;
                tx.height = 120;
                tx.size = 80;
                // tx.scaleX = tx.scaleY = 5;
                tx.textAlign = egret.HorizontalAlign.CENTER;
                tx.verticalAlign = egret.VerticalAlign.MIDDLE;
                this.sp.addChild(tx);
                this.timer = tx;
            }
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

        runTimer(duration: number, next: () => void) {
            let ti = this.ti;
            if (!ti) {
                ti = this.ti = new egret.Timer(1000, duration);

                this.timerListener = () => {
                    this.timer.text = (parseInt(this.timer.text) - 1).toString();
                    console.log('****timer****');
                    if (this.timer.text == '0') {
                        next();
                        ti.stop();
                    }
                };
                ti.addEventListener(egret.TimerEvent.TIMER, this.timerListener, this);
            }

            this.timer.text = duration.toString();
            ti.start();

        }

        clearTimer() {
            let ti = this.ti;
            ti.removeEventListener(egret.TimerEvent.TIMER, this.timerListener, this);
            this.timer.text = '0';
        }
    }
}
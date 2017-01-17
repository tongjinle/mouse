namespace Client{
    export class Cup{
        // 第几个位置
        index:number;
        // 是否有老鼠
        hasMouse:boolean;
        // 

        cupSp:egret.Sprite;

        private cupImg:egret.Bitmap;
        private mouseImg:egret.Bitmap;
        private shadowImg:egret.Bitmap;

        private sh:egret.SpriteSheet;

        constructor(index:number){
            this.sh = RES.getRes('basic_png');

            this.index = index;
            this.hasMouse = false;

            this.cupSp = new egret.Sprite();

            this.createCupImg();
        }

        private createCupImg(){
            let sh = this.sh;

            let cupSp = this.cupSp;
            let cupImg = this.cupImg = new egret.Bitmap(sh.getTexture('cup_nomal_png'));
            cupSp.addChild(cupImg);
            cupSp.width = cupImg.width;
            cupSp.height = cupImg.height;

            let shadowImg  = this.shadowImg = new egret.Bitmap(sh.getTexture('cup_shadow_png'));
            shadowImg.x =cupSp.width/2 ;
            shadowImg.y =cupSp.height- 100;
            cupSp.addChild(shadowImg);

            cupSp.setChildIndex(cupImg,cupSp.numChildren-1);

        }


        setShadowOpacity(opacity:number){
            this.shadowImg.alpha = opacity;
        }

        putMouse(){
            this.hasMouse = true;

            // mouse img
            let sh = this.sh;
            let cupSp = this.cupSp;
            let mouseImg = this.mouseImg 
                = new egret.Bitmap(sh.getTexture('mouse_png'));

            mouseImg.x = cupSp.width/2 - mouseImg.width/2;
            mouseImg.y = cupSp.height/2 - mouseImg.height/2;
            mouseImg.visible = false;

            cupSp.addChild(mouseImg);
            cupSp.setChildIndex(mouseImg,cupSp.numChildren-1);
        }

        showMouse(){
            this.cupImg.texture = this.sh.getTexture('cup_transparent_png');
            this.mouseImg.visible = true;
        }

        fadeoutMouse(){
            this.cupImg.texture = this.sh.getTexture('cup_nomal_png');
            this.mouseImg && egret.Tween.get(this.mouseImg)
            .to({alpha:0},600);

        }
    }
}
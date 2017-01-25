namespace Client {
	export class AniMgr {
		frames: egret.Texture[];
		delay: number;
		next: () => void;
		ti:egret.Timer;
		img : egret.Bitmap;
		constructor(frames, delay, next) {
			this.frames = frames;
			this.delay = delay;
			this.next = next;

			this.img = new egret.Bitmap(frames[0]);
		}

		start() {
			let index = 0;
			this.ti = new egret.Timer(this.delay,this.frames.length);
			this.ti.addEventListener(egret.TimerEvent.TIMER,()=>{
				this.img .texture = this.frames[index];
				index++;
			},null);

			this.ti.addEventListener(egret.TimerEvent.TIMER_COMPLETE,this.next,null);

			this.ti.start();
		}

		stop() { 
			this.ti.stop();
		}
	}
}
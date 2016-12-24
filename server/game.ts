import * as _ from 'underscore';
import User from './user';
import CONFIG from './config';
import { Animal, Role, Position, Score } from './types';

export default class Game {
	// id
	id: string;
	// 玩家列表
	userList: User[];
	// 比分列表
	scoreList: number[];
	// 盘数
	gameCount: number = CONFIG.gameCount;
	// 已经经过的盘数
	roundCount: number;
	// 杯子数量
	cupCount: number = CONFIG.cupCount;
	// 老鼠所在的杯子序号
	cupIndex: number;
	// 猜测的杯子序号
	guessCupIndex: number;
	// 晃动的轨迹
	path: Position[];

	public get isOver() : boolean {
		return this.gameCount-1 == this.roundCount;
	}

	constructor(id:string,userList: User[]) {
		this.id = id;
		this.userList = userList;
		this.scoreList = [];
		this.roundCount = 0;

		this.round();
	}

	// 放置mouse
	putMouse(userId: string, cupIndex: number): boolean {
		let us = this.getUserById(userId);
		if (!us || us.role != Role.roll) {
			return false;
		}
		if (cupIndex < 0 || cupIndex >= this.cupCount) {
			return false;
		}
		this.cupIndex = cupIndex;
		return true;
	}

	// 晃动杯子
	rollCup(userId: string, posiList: Position[]): boolean {
		let us = this.getUserById(userId);
		if (!us || us.role != Role.roll) {
			return false;
		}
		this.path = posiList;
		return true;
	}

	// 猜测mouse
	guessMouse(userId: string, cupIndex: number): boolean {
		let us = this.getUserById(userId);
		if (!us || us.role != Role.guess) {
			return false;
		}
		if (cupIndex < 0 || cupIndex >= this.cupCount) {
			return false;
		}

		this.guessCupIndex = cupIndex;

		this.scoreList.push(this.guessCupIndex == this.cupIndex ? Score.win : Score.lost);

		this.roundCount++;

		return true;
	}


	// 回合
	// false表示已经整个游戏都已经结束了
	round():boolean{
		if(this.isOver){
			return false;
		}
		this.reset();
		return true;
	}

	// 重新开始
	private roundIndex: number = 0;
	private reset() {
		// 交换猜测者和晃动者
		this.userList.forEach((us, index) => {
			us.role = index == this.roundIndex ? Role.roll : Role.guess;
		});
		this.roundIndex = (this.roundIndex + 1) % this.userList.length;

		// 清空一些记录数据,把他们初始化
		this.cupIndex = undefined;
		this.guessCupIndex = undefined;
		this.path = undefined;
	}


	// 通过userId获取user
	private getUserById(userId: string): User {
		return _.find(this.userList, us => us.id == userId);
	}


}
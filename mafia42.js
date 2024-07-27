/**
 * mafia42.js - v0.4
 * By 리트리버 겜미
 * https://github.com/42nd/mafia42
 */

const mafia42 = (function () {
    /**
     * Mafia42JSError는 mafia42.js에서 발생하는 오류입니다.
     * @extends Error
     * @param {string} message - 오류 메시지
     * @returns {Mafia42JSError} - 오류 객체
     */
    class Mafia42JSError extends Error {
        constructor(message) {
            super(message);
            this.name = "Mafia42JSError";
        }
    }

    /**
     * 내부 Random choose 함수
     * @param {array} choices
     * @returns {any} - choices의 임의의 요소
     */
    function choose(choices) {
        var index = Math.floor(Math.random() * choices.length);
        return choices[index];
    }

    //////////

    /**
     * 직업 멘트 생성기입니다.
     * jobMent는 jobMentGen의 여러 함수들을 이용해 완성된 직멘을 생성합니다.
     */
    const jobMentGen = {
        /**
         * 인수의 각 자리 수의 합을 구합니다.
         * @param {number} number 각 자리 수를 더할 수
         * @returns 각 자리 수를 더한 수
         */
        addTime: function (number) {
            var ret = 0;
            do {
                ret += number % 10;
                number = Math.floor(number / 10);
            } while (number > 0);

            return ret;
        },

        /**
         * 특정 숫자를 소인수분해한 직멘을 생성합니다.
         * @param {number} number - 분해할 숫자
         * @param {string} sep - 분해한 숫자들을 구분할 문자
         * @param {string} ment - 소인수분해가 가능할 경우의 멘트. {number}와 {result}, {sum}를 사용할 수 있습니다.
         * @param {string|false} primeMent - 소인수분해가 불가능할 경우의 멘트. {number}을 사용할 수 있으며 false일 시 ment를 생성합니다.
         * @return {string} - 소인수분해 직멘
         */
        primeFac: function (
            number,
            sep = "x",
            ment = "{number}소인수분해하면{result} 다더해서{sum} ",
            primeMent = ""
        ) {
            number = Math.abs(number);

            // 소수 판별 함수
            function isPrime(n) {
                for (let i = 2, s = Math.sqrt(n); i <= s; i++) {
                    if (n % i === 0) return false;
                }
                return n > 1;
            }

            // 소인수분해 함수
            function primeFactors(n) {
                const factors = [];
                let divisor = 2;

                while (n >= 2) {
                    if (n % divisor == 0) {
                        factors.push(divisor);
                        n = n / divisor;
                    } else {
                        divisor++;
                    }
                }
                return factors;
            }

            // 만약 소인수분해가 가능하거나 primeMent == false
            if (!isPrime(number) || primeMent === false) {
                const result = primeFactors(number);
                return [
                    ment
                        .replace(/{number}/g, number)
                        .replace(/{result}/g, result.join(sep))
                        .replace(
                            /{sum}/g,
                            result.reduce((a, b) => a + b, 0)
                        ),
                    result.reduce((a, b) => a + b, 0),
                ];
            } else {
                return [primeMent.replace(/{number}/g, number), number];
            }
        },
    };

    /**
     * 직업 멘트를 생성하는 객체입니다. jobMentGen을 사용합니다.
     */
    const jobMent = {
        /**
         * 경찰 직멘을 jobMentGen을 이용해 생성합니다.
         * @param {object} options - 옵션
         * @param {number} options.time - 현재 배정시간(대부분 HHMM형태)
         * @param {number?} options.tier - 카드 티어
         * @param {number[]?} options.bluewhite - [파란공개수, 흰공개수]의 배열
         * @param {number?} options.maxpick - 최대 픽 수
         * @param {number?} options.calcount - 연산할 횟수
         * @param {(string|function)[]?} options.actions - return 이전 멘트에 실행할 함수 목록. 문자열은 makeTypo, zip 사용가능
         * @returns {string?} - 멘트
         */
        police: function (options = {}) {
            const time = options.time;
            const tier = options.tier || null;
            const bluewhite = options.bluewhite || [];
            const maxpick = options.maxpick || 8;
            const calcount = options.calcount || 2;
            const actions = options.actions || [];

            // 간단하게 미리 lotto 생성하여 사용, 추후 개선 여지 있음
            const lotto = {
                0: ["끝자리0옆집1회로또첫번호10", 10],
                1: ["끝자리1회로또첫번호10", 10],
                2: ["끝자리2회로또첫번호9", 9],
                3: ["끝자리3회로또첫번호11", 11],
                4: ["끝자리4회로또첫번호14", 14],
                5: ["끝자리5회로또첫번호16", 16],
                6: ["끝자리6회로또첫번호14", 14],
                7: ["끝자리7회로또보너스42", 42],
                8: ["끝자리8회로또첫번호8", 8],
                9: ["끝자리9회로또보너스14", 14],
            };

            const addTime = jobMentGen.addTime(time);
            if (addTime == 0) {
                // 0ㄴㅁ이 될수있는 경우의 처리
                return `배정${time} 다더하면 0이라 옆집 1ㄴㅁ`;
            }

            var ment = `배정${time} 다더하고 `;
            var nowNum = addTime;

            // calcount번 연산을 함
            for (let i = 0; i < calcount; i++) {
                if (nowNum >= 50) {
                    // 과도하게 수가 클경우 다더하는 멘트로 줄여줌
                    nowNum = jobMentGen.addTime(nowNum);
                    ment += `또더해서${nowNum} `;
                } else {
                    // 다음에 넣을 연산 기본 후보
                    var next = [
                        // v0.2: 소인수분해 불가 멘트 대신 다더하는 멘트로 변경
                        jobMentGen.primeFac(
                            nowNum,
                            "x",
                            "소인수분해={result}다더해{sum}",
                            `또다더하면${jobMentGen.addTime(nowNum)}`
                        ),
                        // (끝자리)번째 로또번호
                        lotto[nowNum % 10],
                        // 중항이 자연수가 아닐경우 다더하는 멘트로 처리
                        nowNum % 2 != 0
                            ? [
                                  `등차수열1,x,${nowNum}중항은${
                                      (nowNum + 1) / 2
                                  }`,
                                  (nowNum + 1) / 2,
                              ]
                            : nowNum > 10
                            ? [
                                  `다더해서${jobMentGen.addTime(nowNum)}`,
                                  jobMentGen.addTime(nowNum),
                              ]
                            : [
                                  `시간합에또더해${addTime + nowNum}`,
                                  addTime + nowNum,
                              ],
                    ];
                    if (tier) {
                        // 티어 곱하는 직멘 후보
                        next.push([
                            `${tier}티어라${tier}곱하고`,
                            nowNum * tier,
                        ]);
                        next.push([
                            `${tier}티어라${tier}로나눔나머지${nowNum % tier},`,
                            nowNum % tier,
                        ]);
                    }
                    if (bluewhite.length) {
                        // 파란공개수, 흰공개수 곱하는 직멘 후보
                        next.push([
                            `파공${bluewhite[0]}흰공${bluewhite[1]}곱하고더해${
                                bluewhite[0] * bluewhite[1] + nowNum
                            },`,
                            bluewhite[0] * bluewhite[1] + nowNum,
                        ]);

                        if (nowNum - bluewhite[0] < 1) {
                            next.push([
                                `흰공${bluewhite[1]}제곱후더해${
                                    bluewhite[1] * bluewhite[1] + nowNum
                                },`,
                                bluewhite[1] * bluewhite[1] + nowNum,
                            ]);
                        } else {
                            // 파공개수 빼는 직멘
                            next.push([
                                `파공${bluewhite[0]}개빼면${
                                    nowNum - bluewhite[0]
                                },`,
                                nowNum - bluewhite[0],
                            ]);
                        }
                    }
                    next = choose(next);

                    ment += next[0] + " ";
                    nowNum = next[1];
                }
                if (nowNum <= 3) {
                    next.push([
                        `시간합에또더해${addTime + nowNum}/`,
                        addTime + nowNum,
                    ]);
                }
            }
            // 멘트 끊김 방지
            ment += "> ";

            while (nowNum > maxpick) {
                // 최대 픽수보다 크면 루트를 씌워서 줄여줌
                const sqrt = Math.sqrt(nowNum);
                const sqrtNum = Math.floor(sqrt);
                const sqrtPoint1 = Math.floor(sqrt * 10) % 10;
                if (sqrtNum + sqrtPoint1 <= maxpick) {
                    ment += `루트${nowNum}=${sqrtNum}.${sqrtPoint1}더해서${
                        sqrtNum + sqrtPoint1
                    } `;
                    nowNum = sqrtNum + sqrtPoint1;
                } else {
                    ment += `루트${nowNum}=약${sqrtNum}> `;
                    nowNum = sqrtNum;
                }
            }

            if (nowNum == 0) {
                // 0ㄴㅁ이 될수있는 경우의 처리
                ment += "0옆집";
                nowNum = 1;
            }

            ment = ment.trim();
            if (ment.endsWith(nowNum.toString())) {
                ment += `ㄴㅁ`;
            } else {
                ment += `${nowNum}ㄴㅁ`;
            }

            for (let func of actions) {
                if (func == "makeTypo") {
                    func = this.makeTypo;
                }
                if (func == "zip") {
                    func = this.zip;
                }
                ment = func(ment);
            }

            return ment;
        },

        /**
         * 랜덤으로 천지인 키보드 오타를 만들어 마치 사람이 쓴 것처럼 만듭니다.
         * @param {string} ment - 직업 멘트
         * @param {number} count - 최대 오타 생성 개수
         * @returns {string} - 오타가 생성된 직업 멘트
         */
        makeTypo: function (ment, count = 2) {
            ment = ment.replace(/개|루트|다더해서/g, function (s) {
                if (count) {
                    count--;
                    if (s == "개") {
                        return choose([
                            "기ㅣ",
                            "가ㅣ",
                            "개ㅣ",
                            "기ㅣㆍ",
                            "개ㆍ",
                        ]);
                    } else if (s == "루트") {
                        return choose([
                            "루ㅡㅌ",
                            "루투",
                            "루트ㅡ",
                            "르ㅡㆍ트",
                            "르ㆍ투",
                        ]);
                    } else if (s == "다더해서") {
                        return choose([
                            "닫ㆍ해서",
                            "다더핻서",
                            "닫ㆍㅓ해서",
                            "다더햇ㆍㅓ",
                            "다더해서ㆍ",
                        ]);
                    }
                }
                return s;
            });
            return ment;
        },

        /**
         * 직업 멘트의 길이를 줄입니다.
         * @param {string} ment - 길이를 줄일 직업 멘트
         * @returns {string} - 길이가 줄어든 직업 멘트
         */
        zip: function (ment) {
            if (ment.length > 30) {
                ment = ment.replace(/ /g, "");
            }
            return ment;
        },

        /**
         * 특정 조건에 맞는 경찰 직멘을 생성합니다.
         * @param {object} options - 직멘 생성 함수의 파라미터
         * @param {number} minlength - 최소 길이
         * @param {number} maxlength - 최대 길이
         * @param {number} minop - 최소 연산 횟수
         * @param {number} maxop - 최대 연산 횟수
         * @param {number} rerollCount - 무한루프를 방지하기 위한 최대 재시도 횟수
         * @returns {string} - 생성된 경찰 직멘
         */
        rerollLimit: function (
            options = {},
            minlength = 25,
            maxlength = 50,
            minop = 1,
            maxop = 2,
            rerollCount = 20
        ) {
            if (!rerollCount) {
                throw new Mafia42JSError(
                    "Failed to generate jobMent for rerollCount times"
                );
            }

            var ments = [];
            for (let i = minop; i <= maxop; i++) {
                options.calcount = i;
                ments.push(jobMent.police(options));
            }
            ments = ments.filter(function (ment) {
                return ment.length >= minlength && ment.length <= maxlength;
            });
            if (ments.length == 0) {
                return this.rerollLimit(
                    options,
                    minlength,
                    maxlength,
                    minop,
                    maxop,
                    rerollCount - 1
                );
            }
            return choose(ments);
        },
    };

    /**
     * 엽서의 루블 등을 계산하는 함수들입니다.
     */
    const postcard = {
        /**
         * 엽서의 루블을 계산합니다.
         * @param {number} fame - 엽서의 명성
         * @param {number} days - 엽서의 기간
         * @returns {number} - 얻을 수 있는 총 루블
         */
        rubles: (fame, days) => fame * 100 * days,

        /**
         * 권위의 엽서의 명성을 계산합니다.
         * @param {number} senderFame - 보내는 사람의 명성
         * @returns {number} - 상대방이 차감되는 명성
         */
        authority: (senderFame) => {
            const ret = -Math.floor(20 + 1.2 * Math.sqrt(senderFame));
            return ret ? ret : -20;
        },

        /**
         * 지정된 칸만큼 우체통을 늘리기 위해 필요한 루블을 계산합니다.
         * @param {number} currentLimit - 현재 우체통 크기
         * @param {number} numberToIncrease - 늘릴 칸 수
         * @returns {number} - 필요한 루블
         */
        reqRubToIncLim: (currentLimit, numberToIncrease = 10) => {
            if (currentLimit < 42 || currentLimit % 10 != 2) {
                throw new Mafia42JSError(
                    "currentLimit must be bigger than 41 and multiple of 10 plus 2"
                );
            }
            if (numberToIncrease % 10 != 0) {
                throw new Mafia42JSError(
                    "numberToIncrease must be multiple of 10"
                );
            }

            let result = (currentLimit - 32) * 1000;
            if (numberToIncrease > 10) {
                result += mafia42.postcard.reqRubToIncLim(
                    currentLimit + 10,
                    numberToIncrease - 10
                );
            }
            return result;
        },

        /**
         * 현재 우체통에서 목표 우체통까지 올리는 데 필요한 루블을 계산합니다.
         * @param {number} currentLimit - 현재 우체통 크기
         * @param {number} targetLimit - 목표 우체통 크기
         * @returns {number} - 필요한 루블
         */
        reqRubToLim: (currentLimit, targetLimit) => {
            return mafia42.postcard.reqRubToIncLim(
                currentLimit,
                targetLimit - currentLimit
            );
        },

        /**
         * 현재 명성과 각종 항목에 따라 얻는 출석 보상 루블을 계산합니다.
         * @param {number} fame - 현재 명성
         * @param {number} guildLevel - 길드 레벨 (우드부터 마스터 : 1~6)
         * @param {number} guildUserCount - 길드 인원 수
         * @param {number} guildBuilding - 길드 건물(동상) 레벨 (1~6)
         * @param {boolean} celebrity - '유명세' 버프 적용 여부
         * @param {boolean} plateBonus - '황금알을 낳는 거위' 명패 착용 여부
         * @returns {number} - 출석 보상 루블
         */
        getDailyRewardRuble: (
            fame,
            guildLevel,
            guildUserCount,
            guildBuilding,
            celebrity,
            plateBonus
        ) => {
            const guildLevelBuff =
                guildUserCount < 42
                    ? 0.01 * guildLevel
                    : (0.01 * guildLevel * 42) / guildUserCount;
            const guildBuildingBuff =
                guildUserCount < 42
                    ? 0.025 * guildBuilding
                    : (0.025 * guildBuilding * 42) / guildUserCount;
            const celebrityBuff = celebrity
                ? guildUserCount < 42
                    ? 0.03
                    : (0.03 * 42) / guildUserCount
                : 0;
            const plateBonusBuff = plateBonus ? 420 : 0; // 명패 버프는 더하여 계산
            const rubles =
                fame *
                    100 *
                    (1 + guildLevelBuff + guildBuildingBuff + celebrityBuff) +
                plateBonusBuff;
            return Math.floor(rubles);
        },

        /**
         * 현재 명성을 통해 출석 보상 보너스 루나를 계산합니다.
         * @param {number} fame - 현재 명성
         * @returns {number} - 출석 보상 보너스 루나
         */
        getDailyRewardLuna: (fame) => Math.floor(fame / 42),
    };

    const judoProb = {
		// 일수(0일~39일) 2.5% 고정
		famePercentage: (fame) => {
			if (fame == 1) return 8.22 / 100;
			if (fame >= 2 && fame <= 8) return 8.33 / 100;
			if (fame == 9) return 1.44 / 100;
			if (fame >= 10 && fame <= 11) return 1.11 / 100;
			if (fame == 12) return 1.22 / 100;
			if (fame == 13) return 1.0 / 100;
			if (fame >= 14 && fame <= 15) return 1.11 / 100;
			if (fame == 16) return 1.0 / 100;
			if (fame == 17) return 1.11 / 100;
			if (fame >= 18 && fame <= 22) return 1.0 / 100;
			if (fame == 23) return 0.89 / 100;
			if (fame == 24) return 1.0 / 100;
			if (fame >= 25 && fame <= 27) return 0.89 / 100;
			if (fame == 28) return 0.78 / 100;
			if (fame == 29) return 0.89 / 100;
			if (fame >= 30 && fame <= 34) return 0.78 / 100;
			if (fame >= 35 && fame <= 39) return 0.67 / 100;
			if (fame >= 40 && fame <= 43) return 0.56 / 100;
			if (fame >= 44 && fame <= 46) return 0.44 / 100;
			if (fame >= 47 && fame <= 48) return 0.33 / 100;
			if (fame >= 49 && fame <= 50) return 0.22 / 100;
			if (fame == 51) return 0.11 / 100;
		},
	
		evaluateExpr: (expr, variables) => {
			let evaluatedExpr = expr.replace(/명성|명|성|일수|일|수/g, function (match) {
				return variables[match];
			});
	
			return new Function("return " + evaluatedExpr)();
		},
	
		isTrue: (leftExpr, rightExpr, operator, variables) => {
			const leftValue = judoPercentage.evaluateExpr(leftExpr, variables);
			const rightValue = judoPercentage.evaluateExpr(rightExpr, variables);
	
			switch (operator) {
				case "=":
					return leftValue === rightValue;
				case "!=":
					return leftValue !== rightValue;
				case "<=":
					return leftValue <= rightValue;
				case ">=":
					return leftValue >= rightValue;
				case "<":
					return leftValue < rightValue;
				case ">":
					return leftValue > rightValue;
				default:
					throw new Error("알 수 없는 비교 연산자입니다.");
			}
		},
	
		evaluateCondition: function (condition, variables) {
			// AND 연산자를 처리
			if (condition.includes('&')) {
				const subConditions = condition.split('&').map(str => str.trim());
				return subConditions.every(subCondition => this.evaluateCondition(subCondition, variables));
			}
	
			// OR 연산자를 처리
			if (condition.includes('|')) {
				const subConditions = condition.split('|').map(str => str.trim());
				return subConditions.some(subCondition => this.evaluateCondition(subCondition, variables));
			}
	
			// 비교 연산자를 처리
			const comparisonOperators = ["!=", "<=", ">=", "=", "<", ">"];
			let operator;
	
			for (let op of comparisonOperators) {
				if (condition.includes(op)) {
					operator = op;
					break;
				}
			}
			if (!operator) {
				throw new Error("유효한 비교 연산자가 없습니다.");
			}
	
			const [leftExpr, rightExpr] = condition.split(operator).map(str => str.trim());
			return this.isTrue(leftExpr, rightExpr, operator, variables);
		},
	
		getPercent: function (expression) {
			let percent = 0;
			for (let f = 1; f <= 51; f++) {
				let days = 0;
				for (let d = 0; d <= 39; d++) {
					if (
						this.evaluateCondition(expression, {
							명성: f,
							일수: d,
							명: Math.floor(f / 10),
							성: f % 10,
							일: Math.floor(d / 10),
							수: d % 10,
						})
					) {
						days++;
					}
				}
				percent += this.famePercentage(f) * days * 0.025;
			}
	
			return Math.round((percent * 100 + Number.EPSILON) * 10000) / 10000;
		},

		getExpectedValue: function (percent, reward) {
			return percent * reward;
		},
	};

    const color = {
        /**
         * ARGB 코드를 RGB 코드로 변환합니다.
         * @param {number} argb - ARGB 코드
         * @returns {number} - RGB 코드
         */
        ARGBtoRGB: function (argb) {
            return argb & 0x00ffffff;
        },
    };

    return {
        MAX_CHAT_LENGTH: 64,
        //
        jobMent: jobMent,
        jobMentGen: jobMentGen,
        //
        Mafia42JSError: Mafia42JSError,
        //
        postcard: postcard,
        color: color,
		judoProb: judoProb,
        judoPercentage: judoProb // 예전에 사용되던 이름
    };
})();

// Node.js에서 사용할 수 있도록 모듈화
if (typeof module === "object" && typeof module.exports === "object") {
    module.exports = { mafia42 };
} else {
    window.mafia42 = mafia42;
}

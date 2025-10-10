class Voicemail_Gen{
	constructor(prompt, ans1, ans2, ans3){
		this.done = false;
		
		this.type = "voice";
		//this.transcript = "Not implemented yet!";

		//maybe replace it with an image for this one?
		this.imgUrl = prompt;


		//this.correctAnswers = [false,true,true];
		this.correctAnswers = [ans1,ans2,ans3];
		//r1 is reason for company claiming, r2 is reason for requesting personal info, r3 is reason for fake urgency
		
		
	}
	checkCorrect(index, value){
		console.log(this.correctAnswers[index]);
		if(value == this.correctAnswers[index]){
			return true;
		}
		return false;
	}
}
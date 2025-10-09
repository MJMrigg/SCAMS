class Call_Gen{
	constructor(prompt, ans1, ans2, ans3){
		this.type = "call";
		
		this.done = false;
		
		/*this.callID = "Not implemented yet!";
		this.transcript_Line1 = "Not implemented yet!";
		this.transcript_Line2 = "Not implemented yet!";
		this.transcript_Line3 = "Not implemented yet!";
		this.transcript_Line4 = "Not implemented yet!";
		this.transcript_Line5 = "Not implemented yet!";*/

        //maybe replace it with an image for this one?
		this.imgUrl = prompt;

		//this.correctAnswers = [false,true, true];
        this.correctAnswers = [ans1,ans2,ans3];
		//r1 is reason for personal info, r2 is reason for odd payment method, r3 is reason for yesNo questions
		
		
	}
	checkCorrect(index, value){
		if(value == this.correctAnswers[index]){
			return true;//checks if it matches listed correct answers
		}else{
			return false;
		}
	}
}

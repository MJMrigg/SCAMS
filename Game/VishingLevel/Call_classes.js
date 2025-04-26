class Call_Gen{
	constructor(type){
		this.type = type;
		
		this.done = false;
		
		this.callID = "Not implemented yet!";
		this.transcript_Line1 = "Not implemented yet!";
		this.transcript_Line2 = "Not implemented yet!";
		this.transcript_Line3 = "Not implemented yet!";
		this.transcript_Line4 = "Not implemented yet!";
		this.transcript_Line5 = "Not implemented yet!";
		this.correctAnswers = [false,true, true];
		//r1 is reason for personal info, r2 is reason for odd payment method, r3 is reason for yesNo questions
		//r4 is reason for all correct message
		
		this.reasonAnswers = ["r1", "r2", "r3", "r4"];
		
		if(this.type == 0){
			this.callID = "(789)-000-0000";
			this.transcript_Line1 = "Caller: Hey, can you hear me okay?";
			this.transcript_Line2 = "Recipient: Yeah, I can hear you.";
			this.transcript_Line3 = "Caller: Great. Are you an account holder of ####?";
			this.transcript_Line4 = "Recipient: Yes, I am. Why do you ask?";
			this.transcript_Line5 = "Caller: Perfect. Recently the terms of service was changed. Do you have time to go over these changes?";
			this.correctAnswers = [false, false, true];
			this.reasonAnswers = [" No personal information was requested in this call.", " No payment was requested during this call.", " This call majorly consisted of yes and no type questions despite seeming like an innocent call. This can be a major warning sign that can be used to impersonate the victim.", " The major warning sign in this call was the use of only yes and no questions. This can be used for robocalls and to impersonate the victim."];
			
		}else if(type == 1){
			this.callID = "(456)-000-0000";
			this.transcript_Line1 = "Caller: Congratulations! We're calling to let you know that you're the winner of a raffle!";
			this.transcript_Line2 = "Recipient: Okay. What did I win?";
			this.transcript_Line3 = "Caller: You won a $1,000 in a redeemable voucher. There is a small processing fee to claim it. This can be done through gift cards";
			this.transcript_Line4 = "Recipient: Odd. Why is there a processing fee?";
			this.transcript_Line5 = "Caller: It's just standard procedure. Just follow the next steps";
			this.correctAnswers = [false, true, false];
			this.reasonAnswers = [" They didn't ask for any personal identifiers.", " Asked for a processing fee in a gift card despite winning a prize.", " There was no yes or no questions asked.", " The major warning with this is the unusal payment method for a processing fee."];
			
		}else if(type == 2){
			this.callID = "(345)-000-0000";
			this.transcript_Line1 = "Caller: Hello, I'm calling on behalf of your bank to inform you about a recent change in policy. ";
			this.transcript_Line2 = "Recipient: Okay?";
			this.transcript_Line3 = "Caller: This change is an slight increase in interest rates in your checking accounts. ";
			this.transcript_Line4 = "Recipient: Anything I need to do?";
			this.transcript_Line5 = "Caller: Not at all. This message was just to inform all of our clients about the recent change.";
			this.correctAnswers = [false, false, false];
			this.reasonAnswers = [" No personal information was asked to be given.", " No request for any sort of payment.", " No yes or no questions were asked.", " This is a completely normal call."];
			
		}else if(type == 3){
			this.callID = "(132)-000-000";
			this.transcript_Line1 = "Caller: Hi, this is the Social Security Office. I just need to verify your full name to continue.";
			this.transcript_Line2 = "Recipient: I'm #### #####. Why are you calling?";
			this.transcript_Line3 = "Caller: Alright, we've detected suspicious activity. To resolve this issue, you'll need to pay a fee using gift cards so we can properly process the payment.";
			this.transcript_Line4 = "Recipient: Gift cards?";
			this.transcript_Line5 = "Caller: Say 'yes' if you understand.";
			this.correctAnswers = [true, true, true];
			this.reasonAnswers = [" The caller immediately asked for the full name of the victim.", " They ask for the fee to be paid with gift cards. No normal company would ask to be paid in gift cards.", " Asked a yes or no question after avoiding answering the victim questioning the gift card payment method.", " This is a pure example of an extremely obvious scam call. This asks for personal information, a suspicious payment method, and asks for a confirmation after avoiding the question about the gift cards."];
		}
	}
	checkCorrect(index, value){
		if(value == this.correctAnswers[index]){
			return true;//checks if it matches listed correct answers
		}else{
			return false;
		}
	}
}

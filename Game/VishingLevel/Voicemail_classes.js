class Voicemail_Gen{
	constructor(prompt, ans1, ans2, ans3){
		this.done = false;
		
		var type = 4;
		//this.transcript = "Not implemented yet!";
		this.transcript = prompt;
		//this.correctAnswers = [false,true,true];
		this.correctAnswers = [ans1,ans2,ans3];
		//r1 is reason for company claiming, r2 is reason for requesting personal info, r3 is reason for fake urgency
		//r4 is reason for all correct message
		//this.ansReasons = ["r1","r2","r3","r4"];
		this.callerID = "(123)-456-7890";
		if(type == 0){
			this.callerID = "(123)-000-0000";
			this.transcript = "Hi, this is #### from Bank of #####. We were reviewing some recent activity on your account and just need to confirm a few things. Could you give us a call back and have your full account number ready when you do?";
			this.correctAnswers = [false,true,false];
			this.ansReasons = [" The company name sounded real and the caller had remained professional sounding."," The caller asked to have personal information at the ready for when the victim calls back."," There was no sense of urgency made in the message."," The warning in this voicemail was subtle and seemingly innocent but it's good to keep caution when personal information of any kind is requested over the phone."];
		}
		else if(type == 1){
			this.callerID = "(234)-000-0000";
			this.transcript = "This is Officer ##### ###### from the IRS. You owe back taxes and legal action will be taken unless you return this call today. You'll need your Social Security Number ready.";
			this.correctAnswers = [true,true,true];
			this.ansReasons = [" Government agencies will not call you like this or threaten legal action."," They asked for your Social Security Number."," The threat of legal action unless you call back immediately is supposed to make you worry and immediately act."," Every part of this message was sketchy! They had claimed to be an important company, request personally identifying information and made it sound like it was really urgent. Any government officials tend to not give warnings through voicemail."];
		}
		else if(type == 2){
			this.callerID = "(678)-000-0000";
			this.transcript = "Hey, just calling from the local pharmacy. We have your prescription ready. Please stop by to pick it up at your earliest convenience.";
			this.correctAnswers = [false,false,false];
			this.ansReasons = [" Caller sounded like a normal pharmaceutical company and used a generic notification message."," No personal information was mentioned at all."," No sense of urgency was made in this voicemail."," This is a completely normal voicemail. It doesn't request any callback or any personal information."];
		}
		else if(type == 3){
			this.callerID = "(345)-000-0000";
			this.transcript = "Hey, I just need you to call me back as soon as possible. It is really important. Thanks.";
			this.correctAnswers = [false,false,true];
			this.ansReasons = [" The caller didn't try to sound like any type of company at all."," They never asked for any personal information."," They had asked to call back immediately without mentioning why. This isn't suspicious by itself. But it's good to have caution when dealing with unknown numbers that want you to call back immediately.","This voicemail wasn't extremely suspicious or set off any major warnings, but the overall lack of information can be cause for caution."];
		}
		
	}
	checkCorrect(index, value){
		if(value == this.correctAnswers[index]){
			return true;
		}
		return false;
	}
}

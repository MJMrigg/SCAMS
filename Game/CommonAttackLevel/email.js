class email{
    constructor(img, ans){
        //this.imgUrl = '';
        this.type = "email";
        this.imgUrl = img;
        this.done = false;
        //this.corAns = [null, null, null, false, false, null];
        this.corAns = ans;
    }
    checkCorrect(index, value){
        console.log(this.corAns[index]);
		if(value == this.corAns[index]){
			return true;
		}
		return false;
	}

}
class email{
    constructor(img, ans){
        //this.imgUrl = '';
        this.imgUrl = img;
        this.done = false;
        //this.corAns = [null, null, null, false, false, null];
        this.corAns = ans;
    }
    checkCorrect(index, value){
		if(value == this.corAns[index]){
			return true;
		}
		return false;
	}

}
class Smish_Class{
    constructor(img, ans){
		this.type = "text";
        this.imgUrl = img;
        this.done = false;
        //this.corAns = [null, null, null, false, false, null];
        this.corAns = ans;
        console.log(this.corAns);
    }
    checkCorrect(index, value){
    console.log(this.corAns[index]);
		if(value == this.corAns[index]){
			return true;
		}
		return false;
	}
}
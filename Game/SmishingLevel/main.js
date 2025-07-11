//Handle webgl canvas context
class webgl{
    constructor(){
        //Create viewport on the canvas
        gl.viewport(0,0,gl.canvas.width,gl.canvas.height);
        gl.clearColor(1,1,1,1);
        gl.clear(gl.CLEAR_BUFFER_BIT);
        //Get Source code for shaders
        var vertexShaderSource = document.getElementById("2dVertexShader").text;
        var fragementShaderSource = document.getElementById("2dFragmentShader").text;
        //Create Shaders
        var vertexShader = this.createShader(gl.VERTEX_SHADER,vertexShaderSource);
        var fragmentShader = this.createShader(gl.FRAGMENT_SHADER,fragementShaderSource);
        //Create program on GPU to control shaders
        this.program = this.createProgram(vertexShader,fragmentShader);
        gl.useProgram(this.program);
    }
    createShader(type,source){
        //Use source code to create a type of shader, compile it, and return the shader
        var shader = gl.createShader(type);
        gl.shaderSource(shader,source);
        gl.compileShader(shader);
        //Check for error
        var sucess = gl.getShaderParameter(shader,gl.COMPILE_STATUS);
        if(sucess){ //If there wasn't one, return the shader
            return shader;
        }
        //If there was one, delete it
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
    }
    createProgram(vs,fs){
        //Create program, attach vertex shader(vs) and fragment shader(fs), link program, and return it
        var program = gl.createProgram();
        gl.attachShader(program,vs);
        gl.attachShader(program,fs);
        gl.linkProgram(program);
        //Check for error
        var sucess = gl.getProgramParameter(program,gl.LINK_STATUS);
        if(sucess){ //If there wasn't one, return the program
            return program;
        }
        //If there was one, delete it
        console.error(gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
    }
}
//General Object class with variables that all objects will have
class object{
    constructor(){
        this.prefab; //Object type
        this.vertices = []; //First 3 numbers are (x,y,z) and next 3 are rgb values
        this.buffer = gl.createBuffer(); //Create buffer used to send data to GPU
	    this.color = null; //Store what the color is(Different for each type of box)
        this.primitiveType = null; //Store what to render the object as
    }
    //Add the starting point x, y, and z values to the vertices
    startLocation(x, y, z) { //Take in x,y,z coordinates, add it to the vertices, and add vertices to buffer
		this.vertices.push(x, y, z, this.color[0], this.color[1], this.color[2]);
		this.bindBuffer();
	}
    //Bind the vertices to the buffer
	bindBuffer(){
		gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer); //Assign buffer type
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW); //Place vertices in buffer
	}
    //Render the player point. This places it on the screen
    render(program) {
        //Reassign the buffer type in case it got assigned to something else
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);

        //Render position
        //Render vertex positions
        var positionAttributeLocation = gl.getAttribLocation(program, "a_position"); //Get location of positions in memory
        gl.enableVertexAttribArray(positionAttributeLocation); //Tell the program where to start in the memory
        var size = 3; //Positions have 3 elements
        var type = gl.FLOAT;
        var normalize = false;
        var stride = 6 * Float32Array.BYTES_PER_ELEMENT; //Each vertex has 6 elements
        var offset = 0; //Start at beginning of array
        gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset);

        //Render color
        //Render vertex colors(same process as above with different parameters)
        var colorAttributeLocation = gl.getAttribLocation(program, "a_color");
        gl.enableVertexAttribArray(colorAttributeLocation);
        //Colors are still composed of 3 elements, so no need to change size
        //Vertices are still composed of 6 elements, so no need to change stride
        offset = 3 * Float32Array.BYTES_PER_ELEMENT; //The only difference is that the program starts at the 3rd element of the array
        gl.vertexAttribPointer(colorAttributeLocation, size, type, normalize, stride, offset);

        //Add to screen
        var offset = 0;
        var count = Math.min(this.vertices.length/6, 4); //Do this for all vertices, which ranges between 1 and 4
        gl.drawArrays(this.primitiveType, offset, count);
    }
}
//Tutorial point class to specify where the player should click during the tutorial.
class tutorialDot extends object{
    constructor(){
        super();
        this.color = [1.0, 0.0, 1.0];
        this.primitiveType = gl.POINTS;
        this.bounds = [0.1, 0.1, 0.1, 0.1];
    }
    //Move the tutorial point and rerender
    move(x, y){
        this.vertices[0] = x;
        this.vertices[1] = y;
        this.bindBuffer(); //Have no fear, it is only six integers being rebuffered
    }
}
//General Box class
class box extends object{
    constructor() {
        super();
        this.centralPoint = []; //Center of the box(used for collisions)
        this.isFinished = false; //If the square is finished
        this.primitiveType = gl.LINE_LOOP;
    }
	//Add a point to the box, but don't finish the circle. This allows the box to expand as the player drags the mouse
	addPoint(x,y,z){
		//Assuming the starting point was the top left, this would be the bottom left corner
		this.vertices[6] = this.vertices[0];
		this.vertices[7] = y;
		this.vertices[8] = z;
		//Assuming the starting point was the top left, this would be the bottom right corner
		this.vertices[12] = x;
		this.vertices[13] = y;
		this.vertices[14] = z;
		//Assuming the starting point was the top left, this would be the top right corner
		this.vertices[18] = x;
		this.vertices[19] = this.vertices[1];
		this.vertices[20] = z;
		//Add the colors to each of the new corners
		for(let i = 0; i < 3; i++){
			this.vertices[9+(i*6)] = this.color[0];
			this.vertices[10+(i*6)] = this.color[1];
			this.vertices[11+(i*6)] = this.color[2];
		}
		//Update the buffer
		this.bindBuffer();
	}
	finishBox(x,y,z){
		this.addPoint(x,y,z); //Add the final point		
		this.isFinished = true; //Finish the box
	}
}
//Real Points - points that are where suspicious parts of the message are
class realPoint extends box{
    constructor(){
        super();
	    this.color = [0.0, 1.0, 0.0]; //rgb values
        this.found = false; //Start off assuming that the Real Point has not been found
        //bounds - Determine how big a box can before it no longer qualifies as finding the real point(that way the player can't just box the whole screen)
        this.bounds = [];
    }
	finishBox(x,y,z){
		super.finishBox(x,y,z);
		//Use the top left and bottom right corners to find the central point in all 3 dimensions
		for(let i = 0; i < 3; i++){
			//Find the ith dimension of the central point using the ith dimension of top left and bottom right corners
			this.centralPoint.push((this.vertices[i] + this.vertices[18+i]) / 2);
		}
	}
}
//Player points - points that players place on the screen
class playerPoint extends box {
    constructor() {
        super();
	    this.color = [1.0, 0.0, 0.0]; //rgb values
    }
}

//Class that will serve as the main function
class main{
    constructor(points,bounds,text,tip){ //Takes in coordinates for Real Points, their bounds' coordinates, losing text, and takeway tip for this level
   	    this.webgl = new webgl();
        this.realPoints = []; //Parts of the message that are suspicious
        this.playerPoints = []; //Places where the player clicks on the canvas
        this.pointsToFind = points.length/6; //Number of suspicious parts in the message
        this.pointsFound = 0; //Number of suspicious parts of the message found
        this.end = false; //This stage has not ended
        //Update the stage number or handle if this is the tutorial
        if(JSON.parse(sessionStorage.getItem("level1Stage")) > 0){ //If this is an actual level
            document.getElementById("stage").innerText = "Message "+JSON.parse(sessionStorage.getItem("level1Stage"))+"/9";
            document.getElementById("score").innerText = "Current Score: "+JSON.parse(sessionStorage.getItem("currentScore"));
            this.tutorial = false;
        }else{ //If this is the tutorial
            this.tutorial = true;
            this.tutorialPoints = [];
            alert("Welcome to the smishing tutorial! Please draw your eyes to the small text just below \"Tutorial Message\"");
            //Begin the tutorial by writing the first message the player should see on the screen
            this.tutorialText = document.getElementById("tutorial");
            this.tutorialPart = 1;
            this.setTutorialText();
        }
        //Add Real Points to Real Points array and set their bounds
        for(let i = 0; i < points.length; i += 6){
            this.addObject(0, realPoint, [points[i], points[i+1], points[i+2]]);
		    this.realPoints[this.realPoints.length-1].finishBox(points[i+3], points[i+4], points[i+5]);
		    this.realPoints[this.realPoints.length-1].bounds.push(
                Math.abs(this.realPoints[this.realPoints.length-1].centralPoint[0] - bounds[i*(4/6)]), //Left Bound
                Math.abs(this.realPoints[this.realPoints.length-1].centralPoint[1] - bounds[i*(4/6)+1]), //Up Bound
                Math.abs(this.realPoints[this.realPoints.length-1].centralPoint[0] - bounds[i*(4/6)+2]), //Right Bound
                Math.abs(this.realPoints[this.realPoints.length-1].centralPoint[1] - bounds[i*(4/6)+3]), //Down Bound
		    );
        }
        this.losingText = text;
        this.takeaway = tip;
	    this.renderAll();
    }
    addObject(type, prefab, coordinates){
        //Take in object type, its prefab code, and vertex coordinates, create the object, render, and return it
        var temp = new prefab; //Create Object
        //Set properties and coordinates
        temp.prefab = prefab;
        temp.startLocation(coordinates[0], coordinates[1], coordinates[2]);
        //Add to proper array
        if(type == 0){
            this.realPoints.push(temp);
        }else if(type == 1){
            this.playerPoints.push(temp);
        }else if(type == 2){
            this.tutorialPoints.push(temp);
        }else{
            console.log("Error, invalid type: "+type);
            return;
        }
        //Render all objects(including the new one)
        this.renderAll();
        //Return new object(just in case)
        return temp;
    }
	convert(event){ //Convert window coordinates to canvas coordinates
		var clickX = event.clientX;
        var clickY = event.clientY;
    	var rect = canvas.getBoundingClientRect();
    	var realX = clickX - rect.left;
       	var realY = clickY - rect.top;
    	var x = -1 + 2*(realX/canvas.width);
    	var y = -1 + 2*((canvas.height - realY)/canvas.height);
		return [x,y];
	}
    addPlayerPoint(event){
        //Take in mouse click, convert window coordinates to canvas coordinates, and add a Player Point to the canvas
        //Calculate point on canvas where click happened
	    var canvasCoordinates = this.convert(event);
        console.log(canvasCoordinates);
        //Add Box, set coordinates, and render all objects
        if(this.playerPoints.length == 0 || this.playerPoints[this.playerPoints.length-1].isFinished){ //If the last placed box is finished, add a new Player Point
            this.addObject(1, playerPoint, [canvasCoordinates[0], canvasCoordinates[1], 0]);
        }else{ //If it's not, finish it
            this.playerPoints[this.playerPoints.length-1].finishBox(canvasCoordinates[0], canvasCoordinates[1], 0);
        }
        //If this was the tutorial, see if the player clicked where they were supposed to
        if(this.tutorial && this.tutorialPoints.length > 0){
            if(this.tutorialPointClicked(this.tutorialPoints[this.tutorialPoints.length-1], this.playerPoints[this.playerPoints.length-1])){
                this.setTutorialText();
            }
        }
        this.renderAll();
    }
    removePlayerPoint(){
        //Remove the latest Player Point and render
        if(this.playerPoints.length >= 0){
		    delete this.playerPoints[this.playerPoints.length-1];
            this.playerPoints.pop();
            this.renderAll();
        }
        //If this is the tutorial part about removing player points
        if(this.tutorial){
            if(this.tutorialPart == 5){
                this.setTutorialText();
            }
        }
    }
	//When the mouse moves, let the player expand the box by having it follow their mouse
	expandPlayerPoint(event){
		if(this.playerPoints.length > 0 && !(this.playerPoints[this.playerPoints.length-1].isFinished)){ //That is if the box is still unfinished
			var canvasCoordinates = this.convert(event); //Convert window coordinates to canvas coordinates
			this.playerPoints[this.playerPoints.length-1].addPoint(canvasCoordinates[0], canvasCoordinates[1], 0); //Expand the box
			this.renderAll(); //Rerender so that the update box appears on the screen
		}
        //Check if this is the tutorial part about expanding the box 
        if(this.tutorial){
            if(this.tutorialPart == 3){
                this.tutorialPart = 4; //Quickly set it to 4 so that no other mouse movement triggers this
                this.setTutorialText();
            }
        }
	}
    renderAll(){
        //Clear the screen and then render all objects
        gl.clear(gl.CLEAR_BUFFER_BIT);
        if(this.end){ //Only render the Real Points at the end of the game, since they're the answers
            for(var i in this.realPoints){
                this.realPoints[i].render(this.webgl.program);
            }
        }
        for(let i = 0; i < this.playerPoints.length; i++){
            this.playerPoints[i].render(this.webgl.program);
        }
        if(this.tutorial){ //Render tutorial points if this is the tutorial
            for(let i = 0; i < this.tutorialPoints.length; i++){
                this.tutorialPoints[i].render(this.webgl.program);
            }
        }
    }
    //Takes in a player point and a real point and sees if the player point boxed in a real point while staying in the real point's bounds	
    realFound(player, real){
        //Take in a playerPoint and a realPoint and use their distances to caculate if the realPoint was boxed by the playerPoint
        var realDistances = [ //Distances from the realPoint's central point to its edges
            Math.abs(real.centralPoint[0] - real.vertices[0]), //Left edge
            Math.abs(real.centralPoint[1] - real.vertices[1]), //Top edge
            Math.abs(real.centralPoint[0] - real.vertices[12]), //Right edge
            Math.abs(real.centralPoint[1] - real.vertices[13]) //Bottom edge
        ];
        var playerDistances = [ //Distances from the realPoint's central point to the playerPoint's edges
            Math.abs(real.centralPoint[0] - player.vertices[0]), //Left edge
            Math.abs(real.centralPoint[1] - player.vertices[1]), //Top edge
            Math.abs(real.centralPoint[0] - player.vertices[12]), //Right edge
            Math.abs(real.centralPoint[1] - player.vertices[13]) //Bottom edge
        ];
        //Caculate if the entire playerPoint box is within the bounds of the realPoint
        for(let i = 0; i < 4; i++){
            //If the player didn't box part of the message
            //Or if part of the player point is not within the real's bounds, return false
            if(realDistances[i] > playerDistances[i] || playerDistances[i] > real.bounds[i]){
                return false;
            }
        }
        //If all four distances from the real's central point to the player point's edges encompassed the whole real point and didn't go beyond the bounds, return true
        return true;
    }
    //Takes in a tutorial point and the curser's coordinates and sees if the player clicked the tutorial point
    tutorialPointClicked(tutorial, curser){
        for(let i = 0; i < 2; i++){ //For every ith dimension...
            //...if the click occured oustide of the tutorial point's bounds in that dimension, return false
            if(curser[i] > (tutorial.vertices[i]+tutorial.bounds[i]) || curser[i] < (tutorial.vertices[i]-tutorial.bounds[i])){
                return false;
            }
        }
        //If the click was within the tutorial point's bounds in every dimension, return true
        return true;
    }
    //Set tutorial message based on which part of the tutorial the player is at
    async setTutorialText(){
        switch(this.tutorialPart){
            case 1:
                this.tutorialText.innerHTML = "Welcome to the Smishing level! In this level, you will be identifiying what parts of text messages, like the one below, look suspcious and give it away as a smishing message by drawing boxes around those parts.";
                await new Promise(resolve => setTimeout(resolve, 7000));
                this.tutorialText.innerHTML = "Lets begin. This whole text looks like a smishing text, but the part that really sticks out to me is the part where they say that they're a hacker.";
                await new Promise(resolve => setTimeout(resolve, 7000));
                this.tutorialText.innerHTML = "To begin drawing a box, simply click on the beginning part of the message that you think gives it away as a smishing text. Click the pink dot to begin drawing a box around the part where they say they're a hacker.";
                this.addObject(2, tutorialDot, [-0.8653333536783854, 0.546070897083253, -0.5]);
                break;
            case 2:
                this.tutorialText.innerHTML = "Good. Now move the mouse to the new pink dot to expand the box.";
                //Move the tutorial dot using setTimeout, that way the new position has enough time to render correctly.
                setTimeout(() => {
                    this.moveTutorialPoint(-0.3720000203450521, 0.462172591998507);
                }, 0);
                break;
            //No case 3 because tutorial part 3 is immediately changed to 4 upon mousemovement
            case 4:
                await new Promise(resolve => setTimeout(resolve, 900));
                alert("WAIT! I just realized I made you start the box in the wrong place! Luckily, there's a way to fix that. Look at the tutorial text.")
                this.tutorialText.innerHTML = "If you accidently start a box in the wrong place, simply right click to cancel.";
                break;
            case 5:
                this.tutorialText.innerHTML = "Sorry about that. Just had to teach you about canceling. Start the box again by clicking on the pink dot, which this time is in the right place.";
                setTimeout(() => {
                    this.moveTutorialPoint(-0.8653333536783854, 0.516070897083253);
                }, 0);          
                break;
            case 6:
                this.tutorialText.innerHTML = "Good. Now, for real this time, move the mouse to the new pink dot to expand the box.";
                setTimeout(() => {
                    this.moveTutorialPoint(-0.3720000203450521, 0.462172591998507);
                }, 0);
                break;
            case 7:
                this.tutorialText.innerHTML = "Excellent! You have sucessfully boxed a suspicous part of the message. Keep doing this with other parts of the message that stick out to you as suspicous. If you can't find of any, some easy give aways are the fact that it comes from an unknown number and then asking you to download something from a VERY strange looking link with an unsual domain. When you think you've boxed all the suspicous parts of the link, click the Submit button below the text message, and you will be shown the answers, along with how many points you got.";
                //Delete the tutorial point
                setTimeout(() => {
                    delete this.tutorialPoints[this.tutorialPoints.length-1];
                    this.tutorialPoints.pop();
                    this.renderAll();
                }, 0);
                break;
            case 8: 
                this.tutorialText.innerHTML = "One last thing. A suspicous part of the message has a limit on how big the box can be. This ensures that you can't just box the whole message. You have to box every part of the message that gives it away as a smishing text. Go ahead, try to box the whole message.";
                //Have the player start anew with no boxes on the screen
                this.end = false;
                for(let i = this.playerPoints.length-1; i >= 0; i--){
                    delete this.playerPoints[i];
                    this.playerPoints.pop();
                }
                setTimeout(() => {
                    this.renderAll();
                }, 0);
                break;
        }
        this.tutorialPart += 1;
    }
    //Take in the new x and y coordinates for the tutorial point and then re-render
    moveTutorialPoint(x,y){
        this.tutorialPoints[this.tutorialPoints.length-1].move(x, y);
        this.renderAll();
    }
    async submit(stage){ //Takes in the stage number
        //See if the player clicked on all the suspicious parts of the message, calculate their score, end the stage, and move on to the next one

        //For each Player Point
        for(let i = 0; i < this.playerPoints.length; i++){
            //If there are any Real Points, see if the Player Point is touching/colliding with any
            //This is how the program determines if the player clicked on something suspicious in the message
            if(this.pointsFound >= this.pointsToFind){ //If the player already found all the suspicious parts of the message, break
                break;
            }
            for (let j = 0; j < this.realPoints.length; j++) {
                if(this.realPoints[j].found){ //If this point was already found, skip it
                    continue; //This prevents players from getting points for clicking on the same suspicious part of the message twice
                }
                //If there is a collision with the point and player point...
                if (this.realFound(this.playerPoints[i], this.realPoints[j])) {
                    this.pointsFound++; //... mark that the player found another suspicious part of the message
                    this.realPoints[j].found = true; //...and mark that that suspicious part of the message was found
                }
            }
        }
        //Now that the player has submitted their answers of what they believe to be suspicious parts of the message, the real points will now be shown
        this.end = true;
        this.renderAll();
        //Give the player a few seconds to look at their results
        await new Promise(resolve => setTimeout(resolve, 2000));
        //Tell the player the results
        var text;
        if(this.pointsFound == 0){
            text = this.losingText;
        }else if(this.pointsFound == 1){
            text = "You found 1 correct thing, earning you 1 point towards your total score!";
        }else{
            text = "You found "+this.pointsFound+" correct things, earning you "+this.pointsFound+" points towards your total score!";
        }
        alert(text+"\n"+this.takeaway);

        //If it's the tutorial, don't move on to the next stage, as there may be more to teach
        if(this.tutorial){ 
            this.pointsFound = 0; //The player didn't actually get any points, since they're just doing the tutorial
            if(this.tutorialPart == 8){
                this.setTutorialText();
                return;
            }
        }

        //Update the player's score
        var currentScore = JSON.parse(sessionStorage.getItem("currentScore")) + this.pointsFound;
        sessionStorage.setItem("currentScore", JSON.stringify(currentScore));

        //If that was the final stage, send them back the menu
        if(stage == 9){
            //Reset the stage number so that they can play the game again.
            var level1Stage = 0;
            sessionStorage.setItem("level1Stage", JSON.stringify(level1Stage));
            window.location.href='../menu.html'; //Return to menu
        }else{
            //Else, send them to the next stage
            var level1Stage = stage + 1;
            sessionStorage.setItem("level1Stage", JSON.stringify(level1Stage));
            window.location.href = 'stage'+level1Stage+'.html';   
        }
    }

    //Static functions for handling when the player left clicks and right clicks
    static leftClick(event){
        mymain.addPlayerPoint(event);
    }
    static rightClick(event){
        event.preventDefault(); //Prevent menu from popping up and instead remove the latest Player Point
        mymain.removePlayerPoint();
    }
	static mouseMove(event){
		mymain.expandPlayerPoint(event);
	}
}

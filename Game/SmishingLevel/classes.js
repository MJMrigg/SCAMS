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
        this.id; //Object Id
        this.prefab; //Object type
        this.vertices = []; //First 3 numbers are (x,y,z) and next 3 are rgb values
        this.indices = []; //Store how vertices connect using their indices in the vertices array
        this.buffer = gl.createBuffer(); //Create buffer used to send data to GPU
        this.indexBuffer = gl.createBuffer(); //Create buffer used to send index data to GPU
	    this.color = null; //Store what the color is(Different for each type of box)
        this.primitiveType = null; //Store what to render the object as
        this.loc = [0,0,0]; //Store x,y,z coordinates
        this.rot = [0,0,0]; //Store x,y,z rotations
        this.scale = [1,1,1]; //Store x,y,z scale factors
        this.collissionRadius = [0.1,0.1,0.1]; //Collision Radii used to determine if the player clicked on the object
        this.bounds = null; //Bounds = How far away players can click until the game doesn't consider the object clicked
    }
    //Bind the vertices to the buffer
	bindBuffer(){
        //Vertex Buffer
		gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer); //Assign buffer type
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW); //Place vertices in buffer
        //Index Buffer
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer); //Assign buffer type
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(this.indices), gl.STATIC_DRAW); //Place indices in buffer
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

        //Handle Transformations
        var scaleLocation = gl.getUniformLocation(program,"scale");
        gl.uniform3fv(scaleLocation,new Float32Array(this.scale));
        var rotateLocation = gl.getUniformLocation(program,"rotate");
        gl.uniform3fv(rotateLocation,new Float32Array(this.rot));
        var translateLocation = gl.getUniformLocation(program,"translate");
        gl.uniform3fv(translateLocation,new Float32Array(this.loc));

        //Add to screen
        offset = 0;
        //Draw Shape
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.drawElements(this.primitiveType, this.indices.length, gl.UNSIGNED_BYTE, offset);
    }
}
//Tutorial point class to specify where the player should click during the tutorial.
class tutorialDot extends object{
    constructor(){
        super();
        this.color = [1.0, 0.0, 1.0];
        this.vertices.push(0.0, 0.0, 0.0, this.color[0], this.color[1], this.color[2]);
        this.primitiveType = gl.POINTS;
        this.collissionRadius = [0.1, 0.1, 0.1];
    }
    //Move the tutorial point and rerender
    move(x, y){
        this.loc[0] = x;
        this.loc[1] = y;
        this.bindBuffer(); //Have no fear, it is only six integers being rebuffered
    }
}
//General Arrow class
class arrow extends object{
    constructor() {
        super();
        this.primitiveType = gl.TRIANGLES;
        this.color = [0.0, 0.0, 1.0];
        this.real = false; //Whether or not the arrow is a real arrow or a fake one
        this.clicked = false; //Whether or not the arrow has been clicked by the player
        this.vertices.push(
            //Arrow Tip
            0.0, 0.15, 0.0, this.color[0], this.color[1], this.color[2],
            0.1, 0.05, 0.0, this.color[0], this.color[1], this.color[2],
            -0.1, 0.05, 0.0, this.color[0], this.color[1], this.color[2],
            //Arrow Body
            0.05, 0.05, 0.0, this.color[0], this.color[1], this.color[2],
            -0.05, 0.05, 0.0, this.color[0], this.color[1], this.color[2],
            0.05, -0.15, 0.0, this.color[0], this.color[1], this.color[2],
            -0.05, -0.15, 0.0, this.color[0], this.color[1], this.color[2],
        );
        this.indices.push(
            0, 1, 2,
            3, 4, 5,
            4, 5, 6,
        );
        this.bindBuffer();
        this.collissionRadius = [0.1, 0.15, 0.0];
    }
    // Take in a new color, change the arrow to that color, and rebind the buffers
    changeColor(newColor){
        for(let i = 0; i < this.vertices.length; i+=6){
            this.vertices[i+3] = newColor[0];
            this.vertices[i+4] = newColor[1];
            this.vertices[i+5] = newColor[2];
        }
        this.bindBuffer(); //Rebuffer so that the new color pops up
    }
}

//Class that will serve as the main function
class main{
    constructor(){
   	    this.webgl = new webgl();
        this.objects = []; //Parts of the message that are suspicious
        this.allQuestions = []; //All the questions
        //Get player's previous answers from session storage
        this.responses = JSON.parse(sessionStorage.getItem("level1Responses"));
        if(this.responses == undefined || this.responses == "undefined"){
            this.responses = {};
        }
        this.objectCounter = 0; //There are no objects on the screen
        this.stage = JSON.parse(sessionStorage.getItem("level1Stage"))+1; //Get the stage from session storage
        this.currentQuestion = this.stage; //Set the current question the user is currently on to the current stage
        this.init(); //Get the all the questions and setup the first stage
    }
    async init(){
        await this.getAllQuestions(); //Get entire bank of questions from server
        this.setUpStage(); //Set up first stage
    }
    async getAllQuestions(){
        //Get entire bank of smishing questions from server
        var startTime = Date.now(); //Get start and end times to calculate RTT
        var query = await fetch("/getSmishingAll",{
            method: "POST",
            "Content-Type": "application/json",
            body: JSON.stringify({})
        });
        //Get response from post request that contains all the data that was post
        var result = await query.json();
        var endTime = Date.now(); 
        var rtt = endTime - startTime;
        console.log("/getSmishingAll Request RTTs:\nServer-Database Request RTT: "+result.rtt+"ms\nClient-Server Request RTT: "+rtt+"ms\n");
        //Add questions to the questions array
        this.allQuestions = result.questions;
    }
    //Set up the stage
    async setUpStage(){
        //If any, get rid of all arrows and objects on the screen
        for(var i in this.objects){
            delete this.objects[i];
        }
        //Update the stage number or handle if this is the tutorial
        if(this.stage > 0){ //If this is an actual level
            document.getElementById("stage").innerText = "Message "+this.stage+"/50";
            document.getElementById("score").innerText = "Current Score: "+JSON.parse(sessionStorage.getItem("currentScore"));
            this.tutorial = false;
            canvas.style.backgroundImage = "url('srcimgs/stage"+this.stage+".png')"; //Set background image
            //Set the text on the submit button based on if this the current stage or a previous one
            var nextButton = document.getElementById("nextStage");
            nextButton.innerText = "Submit";
            if(this.stage != this.currentQuestion){
                nextButton.innerText = "Continue";
            }
        }/*else{ //If this is the tutorial
            this.tutorial = true;
            this.tutorialPoints = [];
            alert("Welcome to the smishing tutorial! Please draw your eyes to the small text just below \"Tutorial Message\"");
            //Begin the tutorial by writing the first message the player should see on the screen
            this.tutorialText = document.getElementById("tutorial");
            this.tutorialPart = 1;
            canvas.style.background = "url('srcimgs/tutorial.png')"; //Set background image
            this.setTutorialText();
        }*/
        //Get stage data from the backend
        this.pointsFound = 0; //Number of suspicious parts of the message found
        this.realPoints = 0; //Number of arrows that really point to suspicious parts
        //Set up the question
        var question = this.allQuestions[this.stage - 1]; //Subtract 1 to get the element
        var arrows = question.arrows;
        //Get arrow coordinates and if its a real or fake arrow and set up arrows
        this.objectCounter = 0;
        for(let i = 0; i < arrows.length; i+=9){
            var loc = [arrows[i], arrows[i+1], 0];
            var rot = [arrows[i+2], arrows[i+3], arrows[i+4]];
            var scale = [arrows[i+5], arrows[i+6], arrows[i+7]];
            var real = arrows[i+8];
            var newId = this.addObject(0, arrow, loc, rot, scale).id;
            this.objects[newId].real = real;
            if(real){ //If this arrow points to a suspicious part of the message
                this.realPoints += 1; //Add one to the real points count
            }
            //Adjust the arrow's collision radius based on its rotation
            if(arrows[i+4] == 90){
                var xcollisionRadius = this.objects[newId].collissionRadius[0];
                this.objects[newId].collissionRadius[0] = this.objects[newId].collissionRadius[1];
                this.objects[newId].collissionRadius[1] = xcollisionRadius;
            }
            //If this is a previous stage and the arrow was one of the ones that the player clicked, change its color
            if(newId in this.responses){
                this.objects[newId].clicked = true;
                //Change its color based off if the player correctly identified or not
                if(this.responses[newId]){ //It was a correctly identified suspicious point
                    this.objects[newId].changeColor([0.0, 1.0, 0.0]);
                }else{ //It was an incorrectly identified non-suspicious point
                    this.objects[newId].changeColor([1.0, 0.0, 0.0]);
                }
            }
        }
        this.losingText = question.losingText;
        this.takeaway = question.takeaway;
	    this.renderAll();
    }
    addObject(type, prefab, loc, rot, scale){
        //Take in object type, its prefab code, and vertex coordinates, create the object, render, and return it
        var temp = new prefab; //Create Object
        //Set properties
        var id = this.stage+"."+this.objectCounter;
        temp.id = id;
        this.objectCounter += 1;
        temp.prefab = prefab;        
        for(let i = 0; i < 3; i++){
            temp.loc[i] = loc[i];
            temp.rot[i] = (rot[i]/180)*Math.PI;
            temp.scale[i] = scale[i];
            temp.collissionRadius[i] *= scale[i];
        }
        //Add to proper array
        if(type == 0){
            this.objects[id] = temp;
        }else if(type == 2){
            this.tutorialPoints[id] = temp;
        }else{
            console.log("Error, invalid type: "+type);
            return;
        }
        //Render all objects(including the new one)
        this.renderAll();
        //Return new object(just in case)
        return temp;
    }
    //Get the coordinates where the mouse clicked and see if the player clicked on an arrow
    click(event){
        var coordinates = this.convert(event); //Convert to canvas coordinates
        if(isNaN(coordinates[0]) || isNaN(coordinates[1])){ //If the coordinates are invalid, return
            return;
        }
        //If this is the player looking at previous question, don't change any arrows
        if(this.currentQuestion != this.stage){
            return;
        }
        //For every arrow, check to see if it was clicked
        for(var i in this.objects){
            if(!this.pointClicked(this.objects[i], coordinates)){ //If it wasn't, move on to the next one
                continue;
            }
            //If it was, see if it was already clicked
            if(this.objects[i].clicked){ //If it was, turn it blue, marking it as unclicked
                this.objects[i].changeColor([0.0, 0.0, 1.0]);
            }else{ //If it wasn't, turn it pink, marking it as clicked
                this.objects[i].changeColor([1.0, 0.0, 1.0]);
            }
            this.objects[i].clicked = !this.objects[i].clicked; //Mark the object as clicked/not clicked
            this.renderAll(); //Re-render object
        }
    }
	convert(event){ //Convert window coordinates to canvas coordinates to webgl coordinates
		var clickX = event.clientX;
        var clickY = event.clientY;
    	var rect = canvas.getBoundingClientRect();
    	var realX = clickX - rect.left;
       	var realY = clickY - rect.top;
    	var x = -1 + 2*realX/rect.width;
    	var y = -1 + 2*(rect.height-realY)/rect.height;
		return [x,y];
	}
    renderAll(){
        //Clear the screen and then render all objects
        gl.clear(gl.CLEAR_BUFFER_BIT);
        for(var i in this.objects){ //Render every arrow
            this.objects[i].render(this.webgl.program);
        }
        if(this.tutorial){ //Render tutorial points if this is the tutorial
            for(let i = 0; i < this.tutorialPoints.length; i++){
                this.tutorialPoints[i].render(this.webgl.program);
            }
        }
    }
    //Takes in an object and sees if the curser clicked on it
    pointClicked(point, curser){
        var xDistance = Math.abs(point.loc[0]-curser[0]);
        var yDistance = Math.abs(point.loc[1]-curser[1]);
        return (xDistance <= point.collissionRadius[0] && yDistance <= point.collissionRadius[1]);
    }/*
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
    }*/
    //Take in the new x and y coordinates for the tutorial point and then re-render
    moveTutorialPoint(x,y){
        this.tutorialPoints[this.tutorialPoints.length-1].move(x, y);
        this.renderAll();
    }
    //See if the player clicked the right suspicious arrows.
    async submit(){
        var realFound = 0; //Real suspicious points clicked
        var fakeFound = 0; //Fake suspicious points clicked
        //For each arrow
        for(var i in this.objects){
            //Check this arrow was clicked
            if(this.objects[i].clicked){
                //Check if the arrow clicked was a real suspicious point
                if(this.objects[i].real){
                    this.pointsFound += 1; //If the clicked arrow was a real suspicious part of the message, add one to the score
                    realFound += 1;
                    this.objects[i].changeColor([0.0, 1.0, 0.0]); //Turn it green to show that it was correctly clicked
                    this.responses[this.objects[i].id] = true; 
                }else{
                    this.pointsFound -= 1; //If it wasn't a real supsicious part of the messags, subtract one
                    fakeFound += 1;
                    this.objects[i].changeColor([1.0, 0.0, 0.0]); //Turn it red to show that it was incorrectly clicked
                    this.responses[this.objects[i].id] = false;
                }
            } //Arrows not clicked remain blue
        }
        //If the player clicked any arrows and it's not a previous question, give the player a few seconds to look at their results
        if((realFound != 0 || fakeFound != 0) && (this.currentQuestion == this.stage)){
            //Reveal which real points were correctly identified and which fake ones were incorrectly identified
            this.renderAll();
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        //Tell the player the results
        var text = "You ";
        if(this.currentQuestion != this.stage){
            text += "previously ";
        }
        if(realFound == 0){
            text += "correctly labled 0 things as suspicious ";
        }else if(realFound == 1){
            text += "correctly labled 1 thing as suspicious ";
        }else{
            text += "correctly labled "+realFound+" things as suspicious "
        }
        text += "out of "+this.realPoints+" correct things,"
        if(fakeFound == 0){
            text += " and incorrectly labled 0 things as suspicious, ";
        }else if(fakeFound == 1){
            text += " and incorrectly labled 1 thing as suspicious, ";
        }else{
            text += "and incorrectly labled "+fakeFound+" things as suspicious, ";
        }
        if(this.pointsFound <= 0 && realFound == 0){
            text += "earning you 0 points towards you total score. "+this.losingText;
        }else if(this.pointsFound == 1 && realFound >= 0){
            text += "earning you 1 point towards your total score!";
        }else{
            text += "earning you "+this.pointsFound+" points towards your total score";
        }
        if(this.pointsFound > 0){
            text += "!";
        }else{
            if(this.pointsFound > 0 && realFound != 0){
                text +=".";
            }
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
        if(this.stage == 50){
            //Reset the stage number and responses so that they can play the game again.
            sessionStorage.setItem("level1Stage", JSON.stringify(0));
            sessionStorage.setItem("level1Responses", JSON.stringify({}));
            window.location.href='../menu.html'; //Return to menu
        }else{ //Else, send them to the next stage
            //If they weren't exploring a previous stage, move on to the next question
            if(this.currentQuestion == this.stage){
                sessionStorage.setItem("level1Stage", JSON.stringify(this.currentQuestion));
                sessionStorage.setItem("level1Responses", JSON.stringify(this.responses));
                this.currentQuestion += 1;
            }
            this.stage += 1;
            this.setUpStage();  
        }
    }
    //Go back to the previous stage
    previousQuestion(){
        //If this is the first stage, do nothing
        if(this.stage == 1){
            return;
        }
        //Set up the previous stage
        this.stage -= 1;
        this.setUpStage();
    }

    //Static functions for handling when the player left clicks
    static leftClick(event){
        mymain.click(event);
    }
}

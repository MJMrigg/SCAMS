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
//General Box class
class box {
    constructor() {
        this.prefab; //Object type
	this.centralPoint = []; //Center of the box(used for collisions)
        this.vertices = []; //First 3 numbers are (x,y,z) and next 3 are rgb values
        this.buffer = gl.createBuffer(); //Create buffer used to send data to GPU
	this.isFinished = false; //If the square is finished
	this.color = null; //Store what the color is(Different for each type of box)
    }
    //Add the starting point x, y, and z values to the vertex
    startBox(x, y, z) {
        	//Take in x,y,z coordinates, add it to the vertex, and add vertex to buffer
		this.vertices.push(x, y, z, this.color[0], this.color[1], this.color[2]);
		this.bindBuffer();
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
        var primitiveType = gl.LINE_LOOP;
        var offset = 0;
        var count = Math.min(this.vertices.length/6, 4); //Do this for all vertices, which ranges between 1 and 4
        gl.drawArrays(primitiveType, offset, count);
    }
}
//Real Points - points that are where suspicious parts of the message are
class realPoint extends box{
    constructor(){
        super();
	this.color = [0.0, 1.0, 0.0]; //rgb values
        this.found = false; //Start off assuming that the Real Point has not been found
        //Collision Limit - Determine how big a box can before it no longer qualifies as finding the real point(that way the player can't just box the whole screen
        this.collisionLimits = [];
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
    constructor(points,limits,text,tip){ //Takes in coordinates for Real Points, their collision limits, losing text, and takeway tip for this level
   	this.webgl = new webgl();
        this.realPoints = []; //Parts of the message that are suspicious
        this.playerPoints = []; //Places where the player clicks on the canvas
        this.pointsToFind = points.length/6; //Number of suspicious parts in the message
        this.pointsFound = 0; //Number of suspicious parts of the message found
        this.end = false; //This stage has not ended
        //Update the stage number and add the player's current score to the screen
        //document.getElementById("score").innerText = "Current Score: "+JSON.parse(sessionStorage.getItem("currentScore"));
        //document.getElementById("stage").innerText = "Message "+JSON.parse(sessionStorage.getItem("level1Stage"))+"/9";
        //Add Real Points to Real Points array and set their collision limits
        for(let i = 0; i < points.length; i += 6){
            this.addObject(0,realPoint,[points[i], points[i+1], points[i+2]]);
		this.realPoints[this.realPoints.length-1].finishBox(points[i+3], points[i+4], points[i+5]);
		this.realPoints[this.realPoints.length-1].collisionLimits.push(limits[(i/2)], limits[(i/2)+1], limits[(i/2)+2]);
        }
        this.losingText = text;
        this.takeaway = tip;

	this.renderAll();
    }
    addObject(type,prefab,coordinates){
        //Take in object type, its prefab code, and vertex coordinates, create the object, render, and return it
        var temp = new prefab; //Create Object
        //Set properties
        temp.prefab = prefab;
        temp.startBox(coordinates[0],coordinates[1],coordinates[2]);
        //Add to proper array
        if(type == 0){
            this.realPoints.push(temp);
        }else if(type == 1){
            this.playerPoints.push(temp);
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
        //Add Box, set coordinates, and render all objects
	if(this.playerPoints.length == 0 || this.playerPoints[this.playerPoints.length-1].isFinished){ //If the last placed box is finished, add a new Player Point
		this.addObject(1,playerPoint,[canvasCoordinates[0],canvasCoordinates[1],0]);
	}else{ //If it's not, finish it
		this.playerPoints[this.playerPoints.length-1].finishBox(canvasCoordinates[0], canvasCoordinates[1], 0);
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
    }
	//When the mouse moves, let the player expand the box by having it follow their mouse
	expandPlayerPoint(event){
		if(this.playerPoints.length > 0 && !(this.playerPoints[this.playerPoints.length-1].isFinished)){ //That is if the box is still unfinished
			var canvasCoordinates = this.convert(event); //Convert window coordinates to canvas coordinates
			this.playerPoints[this.playerPoints.length-1].addPoint(canvasCoordinates[0], canvasCoordinates[1], 0); //Expand the box
			this.renderAll(); //Rerender so that the update box appears on the screen
		}
	}
    renderAll(){
        //Clear the screen and then render all objects
        gl.clear(gl.CLEAR_BUFFER_BIT);
        //if(this.end){ //Only render the Real Points at the end of the game, since they're the answers
            for(var i in this.realPoints){
		this.realPoints[i].render(this.webgl.program);
            }
        //}
        for(let i = 0; i < this.playerPoints.length; i++){
            this.playerPoints[i].render(this.webgl.program);
        }
    }	
	//Take in two 2d points and calculate the distance between the two
	distance2d(x1,y1,x2,y2){
		return Math.sqrt(((y2-y1)*(y2-y1)) + ((x2-x1)*(x2-x1)));
	}
    checkCollision(player,real){
        //Take in a playerPoint and a realPoint and use the distances to caculate if the realPoint was boxed by the playerPoint
	
	//Calculate distances between the real point's center and the top left and bottom right corners of the real point and player point
	var realTopLeft = this.distance2d(real.centralPoint[0], real.centralPoint[1], real.vertices[0], real.vertices[1]); //Distance from real point's center to its top left corner
	var realBottomRight = this.distance2d(real.centralPoint[0], real.centralPoint[1], real.vertices[12], real.vertices[13]); //Distance from real point's center to its bottom right corner
	var playerTopLeft = this.distance2d(real.centralPoint[0], real.centralPoint[1], player.vertices[0], player.vertices[1]); //Distance from real point's center to player's top left corner
	var playerBottomRight = this.distance2d(real.centralPoint[0], real.centralPoint[1], player.vertices[12], player.vertices[13]); //Distance from real point's center to player's bottom right corner
	var realTopLeftLimit = this.distance2d(real.centralPoint[0], real.centralPoint[1], real.vertices[0]+collisionLimits[0], real.vertices[1]+collisionLimits[1]); //Distance from real point's center to its collision limit towards the top left corner
	var realBottomRightLimit = this.distance2d(real.centralPoint[0], real.centralPoint[1], real.vertices[12]+collisionLimits[0], real.vertices[13]+collisionLimits[1]); //Distance from real point's center to its collision limit towards the bottom right corner

	//Use those distances to determine if the player fully boxed in a real point
	//If the distance from the center of the realPoint is to each corner of the playerPoint, and the playerPoint is within the bounds of the realPoints collision radius, return true
	return ((realTopLeft <= playerTopLeft && playerTopLeft <= realTopLeftLimit) && (realBottomRight <= playerBottomRight && playerBottomRight <= realBottomRightLimit));
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
                if (this.checkCollision(this.playerPoints[i], this.realPoints[j])) {
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
/*
        //Update the player's score
        var currentScore = JSON.parse(sessionStorage.getItem("currentScore")) + this.pointsFound;
        sessionStorage.setItem("currentScore", JSON.stringify(currentScore));

        //If that was the final stage, send them back the menu
        if(stage == 9){
            window.location.href='../menu.html';
        }else{
            //Else, send them to the next stage
            var level1Stage = stage + 1;
            sessionStorage.setItem("level1Stage", JSON.stringify(level1Stage));
            window.location.href = 'stage'+level1Stage+'.html';   
        }*/
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

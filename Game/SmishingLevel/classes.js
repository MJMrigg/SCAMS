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
//General Point class
class point {
    constructor() {
        this.prefab; //Object type
        //Collision Radii - Determine if a player placed a player point near part of the image that is suspicous
        this.collisionRadii = [];
        this.vertex = []; //First 3 numbers are (x,y,z) and next 3 are rgb values
        this.buffer = gl.createBuffer(); //Create buffer used to send data to GPU
    }
    //Add the point x, y, and z values to the vertex
    addPoint(x, y, z) {
        //Take in x,y,z coordinates, add it to the vertex, and add vertex to buffer

        //This is different among child classes, since Real Points and Player Points are different colors
        //Typically, the first line of code of this function will be relevant to the class
        //Followed by these lines sending vertex data to the buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer); //Assign buffer type
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertex), gl.STATIC_DRAW); //Place vertices in buffer
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
        var primitiveType = gl.POINTS;
        var offset = 0;
        var count = 1; //Do this for all vertices
        gl.drawArrays(primitiveType, offset, count);
    }
}
//Real Points - points that are where suspicious parts of the message are
class realPoint extends point{
    constructor(){
        super();
        //Collision Radii are bigger to allow more flexibility for detecting if this part of the message has been clicked
        this.collisionRadii = [0.5, 0.01, 0]; //Default values for collision Radii
        this.found = false; //Start off assuming that the Real Point has not been found
    }
    addPoint(x, y, z) {
        this.vertex.push(x, y, z, 0, 1, 0); //Add (x,y,z) and rgb values. For Real Points, the vertex is green.
        super.addPoint(x,y,z); //Go back to parent class and initialize the buffer
    }
}
//Player points - points that players place on the screen
class playerPoint extends point {
    constructor() {
        super();
        this.collisionRadii = [0.01, 0.01, 0]; //Default values for collision Radii
    }
    addPoint(x,y,z){
        this.vertex.push(x, y, z, 1, 0, 0); //Add (x,y,z) and rgb values. For Player Points, the vertex is red.
        super.addPoint(x,y,z); //Go back to parent class and initialize the buffer
    }
}
//Class that will serve as the main function
class main{
    constructor(points,text,tip){ //Takes in coordinates for Real Points, losing text, and takeway tip for this level
        this.webgl = new webgl();
        this.realPoints = []; //Parts of the message that are suspicious
        this.playerPoints = []; //Places where the player clicks on the canvas
        this.pointsToFind = points.length/6; //Number of suspicious parts in the message
        this.pointsFound = 0; //Number of suspicious parts of the message found
        this.end = false; //This stage has not ended
        //Update the stage number and add the player's current score to the screen
        document.getElementById("score").innerText = "Current Score: "+JSON.parse(sessionStorage.getItem("currentScore"));
        document.getElementById("stage").innerText = "Message "+JSON.parse(sessionStorage.getItem("level1Stage"))+"/9";
        //Add Real Points to Real Points array
        for(let i = 0; i < points.length; i += 6){
            this.addObject(0,realPoint,[points[i],points[i+1],points[i+2]],[points[i+3],points[i+4],points[i+5]]);
        }
        this.losingText = text;
        this.takeaway = tip;
    }
    addObject(type,prefab,coordinates,collisionRadii){
        //Take in object type, its prefab code, and vertex coordinates, create the object, render, and return it
        var temp = new prefab; //Create Object
        //Set properties
        temp.prefab = prefab;
        temp.addPoint(coordinates[0],coordinates[1],coordinates[2]);
        for(let i = 0; i < 3; i++){
            temp.collisionRadii[i] = collisionRadii[i];
        }
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
    addPlayerPoint(event){
        //Take in mouse click, convert window coordinates to canvas coordinates, and add a Player Point to the canvas
        //Calculate point on canvas where click happened
        var clickX = event.clientX;
        var clickY = event.clientY;
        var rect = canvas.getBoundingClientRect();
        var realX = clickX - rect.left;
        var realY = clickY - rect.top;
        var x = -1 + 2*(realX/canvas.width);
        var y = -1 + 2*((canvas.height - realY)/canvas.height);
        console.log(x+" "+y);
        //Add Point, set coordinates, and render all objects
        this.addObject(1,playerPoint,[x,y,0],[0.01,0.01,0]);
    }
    removePlayerPoint(){
        //Remove the latest Player Point and render
        if(this.playerPoints.length >= 0){
            this.playerPoints.pop();
            this.renderAll();
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
    }
    checkCollision(object1,object2){
        //Take in two objects, calculate their distances from each other, and return true if they are close enough to touch
        //This is used to determine if a Player Point is touching a real point

        //Total ranges the objects can be from each other on the x and y axes without a collision(no z since they all have the same z coordinate)
        var xRange = object1.collisionRadii[0]+object2.collisionRadii[0];
        var yRange = object1.collisionRadii[1]+object2.collisionRadii[1];
        //Distances between the objects on the x and y axes
        var xDistance = Math.abs(object1.vertex[0]-object2.vertex[0]);
        var yDistance = Math.abs(object1.vertex[1]-object2.vertex[1]);
        //If the distances are less than the ranges on all axes, return true(there is a collision)
        return (xDistance < xRange && yDistance < yRange);
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
                    continue; //This prevents players from getting points for clicking on the same suspicious part of the messeage twice
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
}
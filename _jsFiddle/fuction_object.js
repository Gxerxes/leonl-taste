

var Employee = function (name, company, salary) {
    this.name = name || '';       //Public attribute default value is null
    this.compony = company || ''; //Public attribute default value is null
    this.salary = salary || 5000; //Public attribute default value is null

    // Private method
    var increaseSalary = function() {
        this.salary = this.salary + 1000;
    };

    // Public method
    this.displayIncreaseSalary = function() {
        increaseSalary();
        console.log(this.salary);
    };
};

var Employee = new Employee('John', 'Pluto', 3000);
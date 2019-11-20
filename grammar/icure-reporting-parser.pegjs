{
	let hcpId = options.hcpId
    let requestFilter = (left, right, rightMost) => {
        let filter = {
            '$type':'PLACEHOLDER', //ServiceByHcPartyTagCodeDateFilter, HealthElementByHcPartyTagCodeFilter...
            'healthcarePartyId':hcpId
        }
        if (left.indexOf(':') === 0) {
            filter.colonKey = left.substr(1)
            filter.colonValue = right
        } else {
            filter.key = left
            filter.value = right
        }
        if (rightMost && rightMost.length == 2) {
            let startDate = rightMost[0]
            if (startDate.length > 0) {
                filter.startDate = startDate
            } else {
                filter.startDate = '0'
            }
            let endDate = rightMost[1]
            if (endDate.length > 0) {
                filter.endDate = endDate
            } else {
                filter.endDate = '99990101'
            }
        }
        return filter
    }
    let monthsToBirthDate = (months) => {
        let birthDate = new Date()
        birthDate.setMonth(new Date().getMonth() - months)
        return formatDate(birthDate)
    }
    let formatDate = (date) => {
        var y = date.getFullYear();
        var m = date.getMonth() + 1;
        var d = date.getDate();
        let formattedDate = '' + y + (m < 10 ? '0' : '') + m + (d < 10 ? '0' : '') + d;
        return formattedDate
    }
}
Pipe
    = req:Request _ pipes:("|" _ Reducer _)* {
        let f = req;
        f.reducers = pipes.map(it => it[2]);

        return f
    }

Reducer
    = name:UQSTR _ "(" firstParam:STR _ otherParams:( "," _ STR)* _ ")" {
        return { reducer: name, params: [firstParam].concat(otherParams ? otherParams.map(it => it[2]) : []) }
    }
    / name: UQSTR { return {reducer: name} }

Request
	= neg:"!"? _ entity:UQSTR _ "[" op:SubtractExpression? "]" {
    	let f = {'$type':'request', 'entity':entity, 'filter':op }
        return neg && {'$type':'ComplementFilter', 'subSet':f} || f;
    }

SubtractExpression
    = left:OrExpression
      right:(_ "-" _ OrExpression _)*
    {
        return right.length && {'$type':'request', 'entity':'SUBTRACT', 'left':left, 'right':right.map(s => s[3])} || left
    }

OrExpression
    = head:AndExpression
      tail:(_ "|" _ AndExpression _)* _
      { return tail.length && {'$type':'UnionFilter', 'filters':[head].concat(tail.map(it=>it[3]))} || head }
AndExpression
    = head:Expression
      tail:(_ "&" _ Expression _)*
      { return tail.length && {'$type':'IntersectionFilter', 'filters':[head].concat(tail.map(it=>it[3]))} || head }

Expression
	= Request / ComparisonExpression

ComparisonExpression
    = neg:"!"? _ "(" _ op:SubtractExpression _ ")" {
    return neg && {'$type':'ComplementFilter', 'subSet':op} || op;
}
/ left:Operand _ op:Comparison _ right:Operand rightMost:OperandSuffix {
	switch(op) {
    	case '==':
    		switch(left) {
    			case 'gender':
    			return {
    				'$type': 'PatientByHcPartyGenderEducationProfession',
    				'healthcarePartyId': hcpId,
    				'gender': right
    			}
    		}
        	return requestFilter(left, right, rightMost)
        case '!=':
        	return {
		      '$type':'ComplementFilter', 'subSet': requestFilter(left, right, rightMost)
            }
        case '<':
        case '>':
        	switch(left) {
            	case 'age':
                	let formattedDate = right.variable ? right : monthsToBirthDate(right)
                	return Object.assign({
                    	'$type':'PatientByHcPartyDateOfBirthBetweenFilter',
                        'healthcarePartyId':hcpId,
                    }, op === '>' ? {minDateOfBirth:0, maxDateOfBirth:formattedDate} : {minDateOfBirth:formattedDate, maxDateOfBirth:99990101})
            }
    }
}

OperandSuffix
    = "{" _ left:OptionalNUM _ "->" _ right:OptionalNUM _ "}" {
        return [left, right]
    }
    / "{" _ "<" date:VARIABLE _ "}" {
        return [date, ""]
    }
    /  "{" _ ">" date:VARIABLE _ "}" {
        return ["", date]
    }
    / "{" _ "<" months:AGE _ "}" {
        return [monthsToBirthDate(months), ""]
    }
    /  "{" _ ">" months:AGE _ "}" {
        return ["", monthsToBirthDate(months)]
    }
    / ""

OptionalNUM = NUM / VARIABLE / _

Operand = STR / AGE / NUM / VARIABLE
Comparison
    = "==" / "!=" / ">" / "<" / "->"
AGE
	= value:[0-9]+ unit:[ym] {
    	return unit === 'y' ? Number(value.join(''))*12 : Number(value.join(''))
    }

NUM
    = value:[0-9]+ { return value.join('') }

STR
    = QSTR / UQSTR

VARIABLE
    = "$" varName:UQSTR { return { variable: '$' + varName } }
UQSTR
    = head:[:_a-zA-Z-] tail:[_a-zA-Z0-9-\.]* { return head + (tail && tail.join('') || '')}


QSTR
    = "\"" str:[^"]* "\"" { return str.join('') }
_ "whitespace"
    = [ \t\n\r]*

{
	let hcpId = options.hcpId
    let svcFilter = (left, right, rightMost) => {
        let filter = {
            '$type':'PLACEHOLDER', //ServiceByHcPartyTagCodeDateFilter', // HealthElementByHcPartyTagCodeFilter
            'healthcarePartyId':hcpId
        }
        if (left.indexOf(':') === 0) {
            filter.tagCode = right
            filter.tagType = left.substr(1)
        } else {
            filter.codeCode = right
            filter.codeType = left
        }
        if (rightMost && rightMost.length == 2) {
            let startDate = rightMost[0]
            if (startDate.length > 0) {
                if (startDate.length <= 8) startDate += "000000"
                filter.startValueDate = startDate
            }
            let endDate = rightMost[1]
            if (endDate.length > 0) {
                if (endDate.length <= 8) endDate += "000000"
                filter.endValueDate = endDate
            }
        }
        return filter
    }
    let monthsToBirthDate = (months) => {
        let birthDate = new Date()
        birthDate.setMonth(new Date().getMonth() - months)
        var y = birthDate.getFullYear();
        var m = birthDate.getMonth() + 1;
        var d = birthDate.getDate();
        let formattedDate = '' + y + (m < 10 ? '0' : '') + m + (d < 10 ? '0' : '') + d;
        return formattedDate
        //let birthDateEpoch = parseInt(birthDate.getTime()/1000)
    }

    let heFilter = (left, right) => {
        let filter = {
            '$type':'HealthElementByHcPartyTagCodeFilter',
            'healthcarePartyId':hcpId
        }
        if (left.indexOf(':') === 0) {
            filter.tagCode = right
            filter.tagType = left.substr(1)
        } else {
            filter.codeCode = right
            filter.codeType = left
        }
        return filter
    }
}
OrExpression
    = head:AndExpression
      tail:(_ "|" _ AndExpression _)* _
      { return tail.length && {'$type':'UnionFilter', 'filters':[head].concat(tail.map(it=>it[3]))} || head }
AndExpression
    = head:Subtract
      tail:(_ "&" _ Subtract _)*
      { return tail.length && {'$type':'IntersectionFilter', 'filters':[head].concat(tail.map(it=>it[3]))} || head }

Subtract
    = left:Expression
      right:(_ "-" _ Expression _)*
    {
        return right.length && {'$type':'request', 'entity':'SUBTRACT', 'left':left, 'right':right[0][3]} || left
    }

Expression
	= Request / ComparisonExpression

Request
	= neg:"!"? _ entity:STR _ "[" op:OrExpression "]" {
    	let f = {'$type':'request', 'entity':entity, 'filter':op }
        return neg && {'$type':'ComplementFilter', 'subSet':f} || f;
    }

ComparisonExpression
    = neg:"!"? _ "(" _ op:OrExpression _ ")" {
    return neg && {'$type':'ComplementFilter', 'subSet':op} || op;
}
/ left:Operand _ op:Comparison _ right:Operand rightMost:OperandSuffix {
	switch(op) {
    	case '==':
        	return svcFilter(left, right, rightMost)
        case '!=':
        	return {
		      '$type':'ComplementFilter', 'subSet': svcFilter(left, right, rightMost)
            }
        case '<':
        case '>':
        	switch(left) {
            	case 'age':
                	let formattedDate = monthsToBirthDate(right)
                	return Object.assign({
                    	'$type':'PatientByHcPartyDateOfBirthBetweenFilter',
                        'healthcarePartyId':hcpId,
                    }, op === '>' ? {minDateOfBirth:0, maxDateOfBirth:formattedDate} : {minDateOfBirth:formattedDate, maxDateOfBirth:99990101})
            } // TODO we can't omit min and max DateOfBirth
    }
}

OperandSuffix
    = "{" _ left:OptionalNUM _ "->" _ right:OptionalNUM _ "}" {
        return [left, right]
    }
    / "{" _ "<" months:AGE _ "}" {
        return [monthsToBirthDate(months), ""]
    }
    /  "{" _ ">" months:AGE _ "}" {
        return ["", monthsToBirthDate(months)]
    }
    / ""

OptionalNUM = NUM / _

Operand = QSTR / STR / AGE / NUM
Comparison
    = "==" / "!=" / ">" / "<" / "->"
AGE
	= value:[0-9]+ unit:[ym] {
    	return unit === 'y' ? Number(value.join(''))*12 : Number(value.join(''))

    }
NUM
    = value:[0-9]+ { return value.join('') }
STR
    = head:[:_a-zA-Z-] tail:[_a-zA-Z0-9-\.]* { return head + (tail && tail.join('') || '')}
QSTR
    = "\"" str:[^"]* "\"" { return str.join('') }
_ "whitespace"
    = [ \t\n\r]*

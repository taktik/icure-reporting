{
	let hcpId = "782f1bcd-9f3f-408a-af1b-cd9f3f908a98"
    let svcFilter = (left, right) => {
    	if (left.indexOf(':') === 0) {
            return {
      			'$type':'ServiceByHcPartyTagCodeDateFilter',
      			'healthcarePartyId':hcpId, 'tagCode':right, 'tagType':left.substr(1)
    		}
        } else {
             return {
      			'$type':'ServiceByHcPartyTagCodeDateFilter',
      			'healthcarePartyId':hcpId, 'codeCode':right, 'codeType':left
    		}
       	}
    }
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

Request
	= entity:STR _ "[" op:OrExpression "]" {
    	return {'$type':'request', 'entity':entity, 'filter':op }
    }

ComparisonExpression
    = neg:"!"? _ "(" _ op:OrExpression _ ")" {
    return neg && {'$type':'ComplementFilter', 'subFilter':op} || op;
}
/ left:Operand _ op:Comparison _ right:Operand {
	switch(op) {
    	case '==':
        	return svcFilter(left,right)
        case '!=':
        	return {
		      '$type':'ComplementFilter', 'subFilter': svcFilter(left,right)
            }
        case '<':
        case '>':
        	switch(left) {
            	case 'age':
                	let birthDate = new Date()
                    birthDate.setMonth(new Date().getMonth() - right)
                    var y = birthDate.getFullYear();
                    var m = birthDate.getMonth() + 1;
                    var d = birthDate.getDate();
    				let formattedDate = '' + y + (m < 10 ? '0' : '') + m + (d < 10 ? '0' : '') + d;
                	let birthDateEpoch = parseInt(birthDate.getTime()/1000)
                	return Object.assign({
                    	'$type':'PatientByHcPartyDateOfBirthBetweenFilter',
                        'healthcarePartyId':hcpId,
                    }, op === '>' ? {minDateOfBirth:0, maxDateOfBirth:formattedDate} : {minDateOfBirth:formattedDate})
            }
    }
}

Operand = QSTR / STR / AGE
Comparison
    = "==" / "!=" / ">"
AGE
	= value:[0-9]+ unit:[ym] {
    	return unit === 'y' ? Number(value.join(''))*12 : Number(value.join(''))

    }
STR
    = head:[:_a-zA-Z-] tail:[_a-zA-Z0-9-]* { return head + (tail && tail.join('') || '')}
QSTR
    = "\"" str:[^"]* "\"" { return str.join('') }
_ "whitespace"
    = [ \t\n\r]*
